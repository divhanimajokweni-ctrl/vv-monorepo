import { createClient } from 'redis';
import { NextResponse } from 'next/server';

export const POST = async () => {
  let redis;
  try {
    // Create and connect to Redis
    redis = createClient();
    await redis.connect();

    // Fetch data from Redis
    const result = await redis.get("item");

    // Return the result in the response
    return new NextResponse(JSON.stringify({ result }), { status: 200 });
  } catch (error) {
    console.error('Redis error:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch from Redis' }), { status: 500 });
  } finally {
    if (redis) {
      await redis.quit();
    }
  }
};