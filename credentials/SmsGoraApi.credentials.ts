import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SmsGoraApi implements ICredentialType {
	name = 'smsGoraApi';

	displayName = 'SMS Gora API';

	icon: Icon = { light: 'file:../icons/smsgora.svg', dark: 'file:../icons/smsgora.dark.svg' };

	documentationUrl = 'https://tekservix.com/smsgora/docs/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Create a key in the SMS Gora dashboard under SMS Gora → API keys (starts with sgk_)',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://tekservix.com/smsgora/api/v1',
			description: 'Leave as is unless Tekservix support tells you otherwise',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/account',
			method: 'GET',
		},
	};
}
