const http = require('http');

const COLORS = ["빨", "노", "파", "초", "흰"];
const T_VALUES = [
  "2T+1","2T+2","2T+3","2T+4",
  "3T+1","3T+2","3T+3","3T+4",
  "4T+1","4T+2","4T+3","4T+4",
  "5T+1","5T+2","5T+3","5T+4",
];

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randTValue() {
  return T_VALUES[Math.floor(Math.random() * T_VALUES.length)];
}

function randRecord() {
  // Let's generate times between 0' 30" and 3' 59"
  const m = randInt(0, 3);
  const s = randInt(0, 59);
  return `${m}' ${s.toString().padStart(2, '0')}"`;
}

async function request(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function generateMockData() {
  // Generate 20 teams (ID from 1 to 20)
  for (let i = 1; i <= 20; i++) {
    const tValue = randTValue();
    const colors = shuffle([...COLORS]);
    const record = randRecord();

    try {
      console.log(`Submitting Team ${i}...`);
      await request('/api/submit', { id: i, colors, tValue });
      // Wait a tiny bit just in case
      await new Promise(r => setTimeout(r, 100));
      
      console.log(`Recording time info for Team ${i}...`);
      await request('/api/record', { id: i, record });
    } catch (err) {
      console.error(`Error with team ${i}:`, err.message);
    }
  }
  console.log("Finished generating mock data.");
}

generateMockData();
