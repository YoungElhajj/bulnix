import { config } from 'dotenv';
config();

const key = process.env.KORAPAY_SECRET_KEY;
console.log('Key present:', !!key, '| Starts with:', key ? key.slice(0, 8) : 'N/A');

const res = await fetch('https://api.korapay.com/merchant/api/v1/balances', {
  headers: { 'Authorization': `Bearer ${key}` }
});
const data = await res.json();
console.log('Status:', res.status);
console.log('Response:', JSON.stringify(data).slice(0, 400));

if (res.status === 200 || data.status === true) {
  console.log('✅ Kora Pay API key is VALID');
} else if (res.status === 401 || res.status === 403) {
  console.log('❌ Kora Pay API key is INVALID — please provide correct credentials');
  process.exit(1);
} else {
  console.log('⚠️ Unexpected response — key may be valid but endpoint returned:', res.status);
}
