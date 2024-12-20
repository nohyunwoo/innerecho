#!/usr/bin/env node

import createError from 'http-errors';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';
import debugModule from 'debug';

//Swagger 설정 가져오기
import {swaggerUi, specs} from './config/swagger.config';

// 라우터와 데이터베이스 모델 가져오기
import indexRouter from './routes/index';
import authRouter from './routes/auth';
import chatRouter from './routes/chat';
import db from './models/index';

dotenv.config();

const app = express();
db.sequelize.sync();  // 데이터베이스 동기화

const debug = debugModule('ohgnoy-backend:server');

// CORS 설정
app.use(cors());

// 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 미들웨어 설정
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 라우터 설정
app.use('/', indexRouter);
app.use('/user', authRouter);
app.use('/chat', chatRouter);

//swagger 모듈 호출하기
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// 404 에러 핸들링
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

// 에러 핸들러
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

/**
 * 서버 설정
 */
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: string): number | string | boolean {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr?.port;
  debug('Listening on ' + bind);
}

export default app;
