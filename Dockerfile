FROM node:12-alpine
WORKDIR /app
# backend packages only
COPY . /app
RUN ["npm","install","--production"]
ENV PORT=4000
EXPOSE 4000
CMD ["node","index.js"]