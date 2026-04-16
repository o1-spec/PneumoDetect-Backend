import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile apps
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Setup Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('PneumoDetect API')
    .setDescription(
      'AI-Powered Pneumonia Detection System - Complete REST API for medical imaging and analysis',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access_token',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User profile management')
    .addTag('Admin', 'Administrative operations')
    .addTag('Patients', 'Patient record management')
    .addTag('Scans', 'X-ray scan management and processing')
    .addTag('Analytics', 'Dashboard statistics and metrics')
    .addTag('Notifications', 'User notifications and alerts')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`);
  console.log(`📚 Swagger API Docs: http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
