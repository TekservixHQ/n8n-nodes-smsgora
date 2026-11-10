import {
	NodeConnectionTypes,
	type INodeProperties,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

// Every SMS Gora answer is { success, data }. Hand n8n the data part.
const dataOnly = {
	output: {
		postReceive: [{ type: 'rootProperty' as const, properties: { property: 'data' } }],
	},
};

const show = (resource: string, operation: string[]) => ({
	show: { resource: [resource], operation },
});

const smsFields: INodeProperties[] = [
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		placeholder: '+15551234567, +447700900123',
		description: 'One or more numbers in international format, separated by commas (up to 1,000)',
		displayOptions: show('sms', ['send']),
		routing: {
			send: {
				type: 'body',
				property: 'recipients',
				value: '={{ $value.split(",").map((n) => n.trim()).filter((n) => n) }}',
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		description: 'The text to send (up to 1,600 characters)',
		displayOptions: show('sms', ['send']),
		routing: { send: { type: 'body', property: 'message' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show('sms', ['send']),
		options: [
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'number',
				default: 0,
				description:
					'Send from this phone (ID shown on its card in the dashboard). Leave empty to use your best online phone.',
			},
			{
				displayName: 'SIM Slot',
				name: 'simSlot',
				type: 'options',
				default: 0,
				options: [
					{ name: 'SIM 1', value: 0 },
					{ name: 'SIM 2', value: 1 },
				],
				routing: { send: { type: 'body', property: 'sim_slot' } },
			},
			{
				displayName: 'Schedule At',
				name: 'scheduleAt',
				type: 'dateTime',
				default: '',
				description: 'Send later instead of now',
				routing: {
					send: {
						type: 'body',
						property: 'schedule_at',
						value: '={{ new Date($value).toISOString() }}',
					},
				},
			},
		],
	},
	{
		displayName: 'Device ID',
		name: 'deviceId',
		type: 'number',
		default: 0,
		required: true,
		description: 'The phone that sends the messages',
		displayOptions: show('sms', ['sendBulk']),
	},
	{
		displayName: 'Message Template',
		name: 'messageTemplate',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Text used for entries that have no message of their own',
		displayOptions: show('sms', ['sendBulk']),
		routing: {
			send: { type: 'body', property: 'messageTemplate', value: '={{ $value || undefined }}' },
		},
	},
	{
		displayName: 'Messages',
		name: 'messages',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		placeholder: 'Add Message',
		description: 'Up to 5,000 recipients in total',
		displayOptions: show('sms', ['sendBulk']),
		options: [
			{
				displayName: 'Message',
				name: 'message',
				values: [
					{
						displayName: 'Recipients',
						name: 'recipients',
						type: 'string',
						default: '',
						placeholder: '+15551234567, +15557654321',
						description: 'Numbers for this entry, separated by commas',
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						description: 'Own text for these numbers. Leave empty to use the template.',
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'messages',
				value:
					'={{ ($value.message || []).map((m) => Object.assign({ recipients: m.recipients.split(",").map((n) => n.trim()).filter((n) => n) }, m.text ? { message: m.text } : {})) }}',
			},
		},
	},
];

const messageFields: INodeProperties[] = [
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: show('message', ['get', 'cancel']),
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show('message', ['getAll']),
		options: [
			{
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				default: 'out',
				options: [
					{ name: 'Sent', value: 'out' },
					{ name: 'Received', value: 'in' },
				],
				routing: { send: { type: 'query', property: 'direction' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'delivered',
				options: [
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Delivered', value: 'delivered' },
					{ name: 'Dispatched', value: 'dispatched' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Queued', value: 'queued' },
					{ name: 'Sent', value: 'sent' },
				],
				routing: { send: { type: 'query', property: 'status' } },
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				routing: { send: { type: 'query', property: 'phone' } },
			},
			{
				displayName: 'Since',
				name: 'since',
				type: 'dateTime',
				default: '',
				routing: {
					send: { type: 'query', property: 'since', value: '={{ new Date($value).toISOString() }}' },
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
				routing: { send: { type: 'query', property: 'limit' } },
			},
		],
	},
];

const receivedFields: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show('receivedSms', ['getAll']),
		options: [
			{
				displayName: 'Device ID',
				name: 'deviceId',
				type: 'number',
				default: 0,
				description: 'Only messages received by this phone',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				routing: { send: { type: 'query', property: 'phone' } },
			},
			{
				displayName: 'Since',
				name: 'since',
				type: 'dateTime',
				default: '',
				routing: {
					send: { type: 'query', property: 'since', value: '={{ new Date($value).toISOString() }}' },
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
				routing: { send: { type: 'query', property: 'limit' } },
			},
		],
	},
];

const deviceFields: INodeProperties[] = [
	{
		displayName: 'Device ID',
		name: 'deviceId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: show('device', ['get']),
	},
];

export class SmsGora implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SMS Gora',
		name: 'smsGora',
		icon: { light: 'file:../../icons/smsgora.svg', dark: 'file:../../icons/smsgora.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send and receive SMS through your own Android phones with the SMS Gora SMS gateway',
		defaults: { name: 'SMS Gora' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'smsGoraApi', required: true }],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl}}',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Device', value: 'device' },
					{ name: 'Message', value: 'message' },
					{ name: 'Received SMS', value: 'receivedSms' },
					{ name: 'SMS', value: 'sms' },
				],
				default: 'sms',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['sms'] } },
				options: [
					{
						name: 'Send',
						value: 'send',
						action: 'Send an SMS',
						description: 'Send an SMS to one or more numbers',
						routing: {
							request: {
								method: 'POST',
								url: '={{ $parameter.additionalFields && $parameter.additionalFields.deviceId ? "/devices/" + $parameter.additionalFields.deviceId + "/send-sms" : "/send-sms" }}',
							},
							...dataOnly,
						},
					},
					{
						name: 'Send Bulk',
						value: 'sendBulk',
						action: 'Send different SMS to many people',
						description: 'Send different texts to different people in one call',
						routing: {
							request: { method: 'POST', url: '=/devices/{{$parameter.deviceId}}/send-bulk-sms' },
							...dataOnly,
						},
					},
				],
				default: 'send',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['message'] } },
				options: [
					{
						name: 'Cancel',
						value: 'cancel',
						action: 'Cancel a queued or scheduled message',
						routing: {
							request: { method: 'POST', url: '=/messages/{{$parameter.messageId}}/cancel' },
							...dataOnly,
						},
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get a message and its delivery status',
						routing: {
							request: { method: 'GET', url: '=/messages/{{$parameter.messageId}}' },
							...dataOnly,
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many messages',
						routing: { request: { method: 'GET', url: '/messages' }, ...dataOnly },
					},
				],
				default: 'get',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['receivedSms'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get received SMS',
						routing: {
							request: {
								method: 'GET',
								url: '={{ $parameter.filters && $parameter.filters.deviceId ? "/devices/" + $parameter.filters.deviceId + "/get-received-sms" : "/received-sms" }}',
							},
							...dataOnly,
						},
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['device'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get a phone',
						routing: {
							request: { method: 'GET', url: '=/devices/{{$parameter.deviceId}}' },
							...dataOnly,
						},
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get your linked phones',
						routing: { request: { method: 'GET', url: '/devices' }, ...dataOnly },
					},
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get account, plan and usage',
						routing: { request: { method: 'GET', url: '/account' }, ...dataOnly },
					},
				],
				default: 'get',
			},
			...smsFields,
			...messageFields,
			...receivedFields,
			...deviceFields,
		],
	};
}
