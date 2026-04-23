import express from 'express';

const app = express();
app.use(express.json());

console.log('Mainframe metric emitter started on port 3005');

app.post('/metrics/breach', (req, res) => {
  res.json({ breach_triggered: true, uptime_bps: 9900 });
});

app.listen(3005);