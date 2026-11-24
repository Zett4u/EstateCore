import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('EstateCoreBootstrap');
  const app = await NestFactory.create(AppModule);

  // Backward compatibility middleware:
  // Maps incoming legacy '/api/...' calls to canonical PDF '/api/v1/...' routes
  app.use((req: any, res: any, next: any) => {
    if (req.url && req.url.startsWith('/api/') && !req.url.startsWith('/api/v1/')) {
      req.url = req.url.replace(/^\/api\/(?!v1(\/|$))/, '/api/v1/');
    }
    next();
  });

  // Set canonical global API prefix mandated by estatecire.pdf Lab 05
  app.setGlobalPrefix('api/v1');

  // Enable CORS for frontend and automated test harnesses
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter for unified error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`EstateCore REST API Server running at http://0.0.0.0:${port}/api/v1`);
  logger.log(`Backward compatibility active: /api/ -> /api/v1/ transparent alias`);
}
bootstrap();
