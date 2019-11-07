docker run --name redis -d --restart=always \
  --publish 6379:6379 \
  --env 'REDIS_PASSWORD=123' \
  --volume /Users/asimashfaq/Projects/rss-example/redis:/var/lib/redis \
  sameersbn/redis:4.0.9-2

  docker run --name redis -d --restart=always  --publish 6379:6379 \
    -e ALLOW_EMPTY_PASSWORD=yes \
    -v /Users/asimashfaq/Projects/rss-example/redis:/bitnami/redis/data \
    bitnami/redis:latest