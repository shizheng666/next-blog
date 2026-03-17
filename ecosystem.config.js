module.exports = {
  apps: [
    {
      name: "next-blog",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/next-blog/current",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
