# n8n-nodes-smsgora

[![npm](https://img.shields.io/npm/v/n8n-nodes-smsgora.svg)](https://www.npmjs.com/package/n8n-nodes-smsgora)

**SMS Gora SMS Gateway** - official n8n community nodes: send and receive SMS through your own Android phones, triggers on incoming SMS and delivery reports.

n8n community nodes for [SMS Gora](https://tekservix.com/smsgora/), the SMS gateway that sends and receives texts through your own Android phones.

Send SMS from any workflow, and start workflows when one of your phones receives an SMS or a message is delivered. There's no sender ID registration and no per-message fee from us: your mobile operator bills the texts like any SMS.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Trigger](#trigger) · [Examples](#example-workflows)

## Installation

In n8n, go to **Settings → Community Nodes → Install**, enter `n8n-nodes-smsgora` and confirm. See the [n8n community nodes guide](https://docs.n8n.io/integrations/community-nodes/installation/) for self-hosted setups.

## Credentials

1. In the SMS Gora dashboard, link an Android phone (install the SMS Gora app and scan the QR code).
2. Go to **SMS Gora → API keys** and create a key (it starts with `sgk_`).
3. In n8n, create an **SMS Gora API** credential and paste the key. n8n tests it against your account.

## Operations

| Resource | Operations |
|---|---|
| SMS | **Send** to one or many numbers (choose phone, SIM and schedule), **Send Bulk** with different texts per recipient (up to 5,000) |
| Message | **Get** (delivery status), **Get Many** (filter by direction, status, phone, date), **Cancel** a queued or scheduled message |
| Received Message | **Get Many** incoming SMS, for all phones or one phone |
| Device | **Get**, **Get Many** linked phones |
| Account | **Get** plan and usage |

The SMS Gora node can also be used as a **tool by n8n AI agents**, so an agent can text a customer or read replies.

## Trigger

**SMS Gora Trigger** starts a workflow on:

- SMS Received
- SMS Sent
- SMS Delivered
- SMS Failed

When you activate the workflow, the node registers its webhook in your SMS Gora account automatically and removes it again when you deactivate. Every request is checked against its HMAC-SHA256 signature, so nobody else can start the workflow.

## Example workflows

- **OTP / verification code:** Webhook → Code (generate code) → SMS Gora *Send*
- **SMS auto-reply:** SMS Gora Trigger (*SMS Received*) → IF (keyword) → SMS Gora *Send*
- **Order shipped:** Shopify / WooCommerce trigger → SMS Gora *Send* to the customer's phone
- **Missed delivery alert:** SMS Gora Trigger (*SMS Failed*) → Slack / email
- **SMS to Google Sheets:** SMS Gora Trigger → Google Sheets *Append row*

## Compatibility

Built with the official n8n node starter (Nodes API version 1). Works with current n8n versions, self-hosted or n8n Cloud once verified.

## Resources

- [SMS Gora API reference](https://tekservix.com/smsgora/docs/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## More from Tekservix

- [WAservix WhatsApp API Gateway](https://tekservix.com/waservix/): WhatsApp from your own number, also on n8n (`n8n-nodes-waservix`)
- [AI Sales Agent](https://tekservix.com/ai-sales-agent): answers customers on WhatsApp and SMS using your website's content
- [Website to App](https://tekservix.com/mobile-apps): turn your website into Android and iOS apps
- SMS Gora client libraries for 12 languages: [github.com/TekservixHQ](https://github.com/TekservixHQ)

## License

MIT
