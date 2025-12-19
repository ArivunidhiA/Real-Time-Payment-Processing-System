#!/bin/bash
# Start script for Kafka on Render
# This ensures Kafka starts properly and creates the transactions topic

echo "Starting Zookeeper..."
zookeeper-server-start.sh config/zookeeper.properties &
ZOOKEEPER_PID=$!

# Wait for Zookeeper to be ready
echo "Waiting for Zookeeper to start..."
sleep 10

echo "Starting Kafka..."
kafka-server-start.sh config/server.properties &
KAFKA_PID=$!

# Wait for Kafka to be ready
echo "Waiting for Kafka to start..."
sleep 15

# Create transactions topic if it doesn't exist
echo "Creating transactions topic..."
kafka-topics.sh --create \
  --if-not-exists \
  --bootstrap-server localhost:9092 \
  --replication-factor 1 \
  --partitions 1 \
  --topic transactions || echo "Topic may already exist"

echo "Kafka is ready!"
echo "Zookeeper PID: $ZOOKEEPER_PID"
echo "Kafka PID: $KAFKA_PID"

# Keep the script running
wait

