import { createHmac, timingSafeEqual } from 'crypto';
import {
	NodeApiError,
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type IHttpRequestMethods,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
	type JsonObject,
} from 'n8n-workflow';

async function smsGoraRequest(
	this: IHookFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('smsGoraApi');
	try {
		const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'smsGoraApi', {
			method,
			url: `${String(credentials.baseUrl).replace(/\/+$/, '')}${path}`,
			body,
			json: true,
		})) as IDataObject;
		return (response?.data ?? response) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export class SmsGoraTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SMS Gora Trigger',
		name: 'smsGoraTrigger',
		icon: { light: 'file:../../icons/smsgora.svg', dark: 'file:../../icons/smsgora.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description:
			'Starts the workflow when one of your phones receives an SMS, or a sent SMS is sent, delivered or fails',
		defaults: { name: 'SMS Gora Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'smsGoraApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['sms.received'],
				options: [
					{ name: 'SMS Delivered', value: 'sms.delivered' },
					{ name: 'SMS Failed', value: 'sms.failed' },
					{ name: 'SMS Received', value: 'sms.received' },
					{ name: 'SMS Sent', value: 'sms.sent' },
				],
			},
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'number',
				default: 0,
				description: 'Only events from this phone. Leave 0 for all your phones.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				if (staticData.webhookId === undefined) return false;
				const webhooks = (await smsGoraRequest.call(this, 'GET', '/webhooks')) as unknown;
				const list = Array.isArray(webhooks) ? (webhooks as IDataObject[]) : [];
				const found = list.some((w) => String(w.id) === String(staticData.webhookId));
				if (!found) {
					delete staticData.webhookId;
					delete staticData.secret;
				}
				return found;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const deviceId = this.getNodeParameter('deviceId', 0) as number;
				const created = await smsGoraRequest.call(this, 'POST', '/webhooks', {
					url: this.getNodeWebhookUrl('default'),
					events: this.getNodeParameter('events') as string[],
					device_id: deviceId ? deviceId : null,
				});
				if (created.id === undefined) return false;
				const staticData = this.getWorkflowStaticData('node');
				staticData.webhookId = created.id as number;
				staticData.secret = created.secret as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				if (staticData.webhookId !== undefined) {
					try {
						await smsGoraRequest.call(this, 'DELETE', `/webhooks/${staticData.webhookId}`);
					} catch (error) {
						this.logger.warn(`SMS Gora: could not delete webhook ${staticData.webhookId}: ${(error as Error).message}`);
						return false;
					}
					delete staticData.webhookId;
					delete staticData.secret;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const staticData = this.getWorkflowStaticData('node');
		const secret = staticData.secret as string | undefined;

		// Check the HMAC signature so nobody else can start this workflow.
		if (secret) {
			const raw = (req as unknown as { rawBody?: Buffer }).rawBody;
			const signature = String(this.getHeaderData()['x-smsgora-signature'] ?? '');
			const payload = raw ?? Buffer.from(JSON.stringify(this.getBodyData()));
			const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
			const a = Buffer.from(expected);
			const b = Buffer.from(signature);
			if (a.length !== b.length || !timingSafeEqual(a, b)) {
				const res = this.getResponseObject();
				res.status(401).send('Invalid signature');
				return { noWebhookResponse: true };
			}
		}

		return { workflowData: [this.helpers.returnJsonArray(this.getBodyData())] };
	}
}
