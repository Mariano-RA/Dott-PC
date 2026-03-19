import { Injectable } from "@nestjs/common";
import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

@Injectable()
export class MinioStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT || "http://minio:9000";
    const region = process.env.MINIO_REGION || "us-east-1";
    const accessKeyId = process.env.MINIO_ACCESS_KEY || "minioadmin";
    const secretAccessKey = process.env.MINIO_SECRET_KEY || "minioadmin";
    this.bucket = process.env.MINIO_BUCKET || "product-images";

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async ensureBucketExists() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch {
      // ignore
    }
    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
  }

  async putObject(params: {
    key: string;
    body: Uint8Array;
    contentType?: string | null;
  }) {
    await this.ensureBucketExists();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType || undefined,
      })
    );
  }

  async getObject(key: string) {
    return await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }
}

