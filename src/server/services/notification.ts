import { Contact } from '../db/database';
import { config } from '../config';

export async function sendLeadNotification(contact: Contact): Promise<void> {
  const tasks: Promise<any>[] = [];

  // 1. Telegram Bot Notification
  if (config.webhooks.telegramBotToken && config.webhooks.telegramChatId) {
    tasks.push(sendTelegramNotification(contact));
  }

  // 2. Discord Webhook Notification
  if (config.webhooks.discordWebhookUrl) {
    tasks.push(sendDiscordNotification(contact));
  }

  // 3. Slack Webhook Notification
  if (config.webhooks.slackWebhookUrl) {
    tasks.push(sendSlackNotification(contact));
  }

  // 4. Custom Generic Webhook
  if (config.webhooks.customWebhookUrl) {
    tasks.push(sendCustomWebhook(contact));
  }

  if (tasks.length > 0) {
    // Run all notifications concurrently in background
    Promise.allSettled(tasks).then(results => {
      results.forEach(res => {
        if (res.status === 'rejected') {
          console.error('[Notification Error]:', res.reason);
        }
      });
    });
  }
}

async function sendTelegramNotification(contact: Contact): Promise<void> {
  const text = [
    `⚡ *New Lead on ViezAI Landing!*`,
    ``,
    `👤 *Name:* ${escapeMarkdownV1(contact.full_name)}`,
    `📧 *Email:* \`${contact.email}\``,
    `🏢 *Company:* ${escapeMarkdownV1(contact.company || 'N/A')}`,
    `🎯 *Need:* ${escapeMarkdownV1(contact.need || 'Enterprise AI Consultation')}`,
    contact.team_size ? `👥 *Team Size:* ${contact.team_size}` : '',
    contact.deployment_mode ? `🛡️ *Deployment:* ${contact.deployment_mode}` : '',
    ``,
    `💬 *Message:*`,
    `_${escapeMarkdownV1(contact.message || 'No message provided.')}_`,
    ``,
    `🕒 _Time: ${new Date(contact.created_at).toLocaleString('vi-VN')}_`,
  ].filter(Boolean).join('\n');

  const url = `https://api.telegram.org/bot${config.webhooks.telegramBotToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: config.webhooks.telegramChatId,
      text,
      parse_mode: 'Markdown',
    }),
  });
}

async function sendDiscordNotification(contact: Contact): Promise<void> {
  const payload = {
    username: 'ViezAI Lead Ingest',
    avatar_url: 'https://viezai.com/logo.png',
    embeds: [
      {
        title: '🚀 New Enterprise Contact Form Submission',
        color: 0x10b981, // Emerald green
        fields: [
          { name: 'Full Name', value: contact.full_name, inline: true },
          { name: 'Email', value: contact.email, inline: true },
          { name: 'Company', value: contact.company || 'N/A', inline: true },
          { name: 'Need / Service', value: contact.need || 'General Consultation', inline: true },
          { name: 'Team Size', value: contact.team_size || 'N/A', inline: true },
          { name: 'Deployment', value: contact.deployment_mode || 'N/A', inline: true },
          { name: 'Message', value: contact.message || 'No message provided.', inline: false },
        ],
        footer: { text: `Lead ID: ${contact.id}` },
        timestamp: contact.created_at,
      },
    ],
  };

  await fetch(config.webhooks.discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function sendSlackNotification(contact: Contact): Promise<void> {
  const payload = {
    text: `⚡ New Lead from ViezAI Landing: *${contact.full_name}* (${contact.email}) at *${contact.company || 'Unknown Company'}*`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚀 New Lead Captured - ViezAI', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name:*\n${contact.full_name}` },
          { type: 'mrkdwn', text: `*Email:*\n${contact.email}` },
          { type: 'mrkdwn', text: `*Company:*\n${contact.company || 'N/A'}` },
          { type: 'mrkdwn', text: `*Need:*\n${contact.need || 'Enterprise AI'}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n>${contact.message.replace(/\n/g, '\n>') || '_No message_'}`
        },
      },
    ],
  };

  await fetch(config.webhooks.slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function sendCustomWebhook(contact: Contact): Promise<void> {
  await fetch(config.webhooks.customWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-ViezAI-Event': 'contact.created',
    },
    body: JSON.stringify({
      event: 'contact.created',
      timestamp: new Date().toISOString(),
      data: contact,
    }),
  });
}

function escapeMarkdownV1(text: string): string {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}
