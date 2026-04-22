package queue

import (
	"context"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

type QueueMessage struct {
	ID        string
	Type      string
	Payload   interface{}
	Timestamp time.Time
	Headers   map[string]string
}

type MessageQueue struct {
	queue  chan QueueMessage
	redis  *redis.Client
	mutex  sync.RWMutex
	stopCh chan struct{}
}

func NewMessageQueue(size int, redisClient *redis.Client) *MessageQueue {
	return &MessageQueue{
		queue:  make(chan QueueMessage, size),
		redis:  redisClient,
		stopCh: make(chan struct{}),
	}
}

func NewRedisClient(addr string) *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr: addr,
	})
}

func (mq *MessageQueue) Enqueue(msg QueueMessage) bool {
	select {
	case mq.queue <- msg:
		return true
	default:
		return false // Queue full
	}
}

func (mq *MessageQueue) Dequeue() (QueueMessage, bool) {
	select {
	case msg := <-mq.queue:
		return msg, true
	default:
		return QueueMessage{}, false
	}
}

func (mq *MessageQueue) Size() int {
	return len(mq.queue)
}

func (mq *MessageQueue) Close() {
	close(mq.stopCh)
}
