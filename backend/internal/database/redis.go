package database

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"kaset-fair-backend/internal/config"

	"github.com/redis/go-redis/v9"
)

const (
	MaxLoginAttempts = 5
	LockoutDuration  = 30 * time.Second
	AttemptsTTL      = 5 * time.Minute
)

type RedisClient struct {
	Client *redis.Client
}

func ConnectRedis(cfg *config.Config) (*RedisClient, error) {
	addr := fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort)
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: cfg.RedisPassword,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis at %s: %w", addr, err)
	}

	log.Printf("Successfully connected to Redis database at %s", addr)
	return &RedisClient{Client: rdb}, nil
}

func (r *RedisClient) Ping(ctx context.Context) error {
	if r == nil || r.Client == nil {
		return fmt.Errorf("Redis client not initialized")
	}
	return r.Client.Ping(ctx).Err()
}

// CheckLoginLock checks if the username is currently locked out
func (r *RedisClient) CheckLoginLock(ctx context.Context, username string) (bool, int, error) {
	if r == nil || r.Client == nil {
		return false, 0, nil
	}

	lockKey := fmt.Sprintf("login_locked:%s", username)
	ttl, err := r.Client.TTL(ctx, lockKey).Result()
	if err != nil {
		return false, 0, err
	}

	if ttl > 0 {
		return true, int(ttl.Seconds()), nil
	}

	return false, 0, nil
}

// RecordFailedLogin increments failed attempts and locks the account if attempts >= 5
func (r *RedisClient) RecordFailedLogin(ctx context.Context, username string) (attempts int, isLockedNow bool, remainingSeconds int, err error) {
	if r == nil || r.Client == nil {
		return 1, false, 0, nil
	}

	attemptsKey := fmt.Sprintf("login_attempts:%s", username)
	lockKey := fmt.Sprintf("login_locked:%s", username)

	val, err := r.Client.Incr(ctx, attemptsKey).Result()
	if err != nil {
		return 0, false, 0, err
	}

	// Set expiration on first attempt
	if val == 1 {
		r.Client.Expire(ctx, attemptsKey, AttemptsTTL)
	}

	if val >= MaxLoginAttempts {
		// Lock account for LockoutDuration (30 seconds)
		if err := r.Client.Set(ctx, lockKey, strconv.FormatInt(val, 10), LockoutDuration).Err(); err != nil {
			return int(val), false, 0, err
		}
		// Clear attempt counter after locking
		r.Client.Del(ctx, attemptsKey)
		return int(val), true, int(LockoutDuration.Seconds()), nil
	}

	return int(val), false, 0, nil
}

// ResetLoginAttempts clears both attempts and lock keys on successful login
func (r *RedisClient) ResetLoginAttempts(ctx context.Context, username string) error {
	if r == nil || r.Client == nil {
		return nil
	}

	attemptsKey := fmt.Sprintf("login_attempts:%s", username)
	lockKey := fmt.Sprintf("login_locked:%s", username)

	return r.Client.Del(ctx, attemptsKey, lockKey).Err()
}
