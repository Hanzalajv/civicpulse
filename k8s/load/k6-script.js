import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '60s', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

const BASE = __ENV.BASE_URL || 'http://localhost:8001';

export default function () {
  const payload = JSON.stringify({
    text: 'Burst water main flooding Street 12 during load test',
    location: 'Street 12 load',
  });
  const res = http.post(`${BASE}/api/complaints`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res, { 'status 201 or 429': (r) => r.status === 201 || r.status === 429 });
}