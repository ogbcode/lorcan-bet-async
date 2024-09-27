import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.APP_NAME || 'API')
    .setDescription(process.env.APP_DESCRIPTION || 'API Documentation')
    .setVersion(process.env.API_VERSION || '1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: false,
  });

  app.enableCors();

  // Global validation pipes for input validation
  app.useGlobalPipes(new ValidationPipe());

  // Global API prefix and versioning
  app.setGlobalPrefix('/backend/');
  app.enableVersioning({
    type: VersioningType.URI,
  });

  try {
    SwaggerModule.setup('/api', app, document, {
      swaggerOptions: {
        useGlobalPrefix: true,
      },
    });
  } catch (error) {
    console.error('Error setting up Swagger:', error);
  }

  // Kafka setup

  // await app.startAllMicroservices();
  await app.listen(process.env.PORT );
  const url = await app.getUrl();
  console.log(`Application is running on: ${url}`);
}

bootstrap();
