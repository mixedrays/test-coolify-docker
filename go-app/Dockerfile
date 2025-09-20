# Use the official Golang image to create a build artifact.
FROM golang:1.21-alpine as builder

WORKDIR /app

# Copy local code to the container image.
# Copy go.mod and go.sum first to leverage Docker cache
COPY go.mod go.sum* ./
RUN go mod download

COPY . .

# Build the binary.
# CGO_ENABLED=0 is important for static linking with alpine base image
RUN CGO_ENABLED=0 go build -o main .

# Use a minimal image for the final stage.
FROM alpine:latest
WORKDIR /root/

# Copy the binary from the builder stage.
COPY --from=builder /app/main .

# Expose port 8080 (optional, good practice for documentation)
EXPOSE 8080

# Command to run the executable.
CMD ["./main"]
