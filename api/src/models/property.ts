import { randomUUID } from "crypto";
import { resize, rotate } from "../services/images";
import s3 from "../services/s3";
import { dal } from "../dal";
import {
  IMAGE_PROPERTY_THUMBNAIL_WIDTH,
  IMAGE_PROPERTY_WIDTH,
  S3_IMAGES_BUCKET,
  S3_IMAGES_PREFIX,
} from "../config";
import Property from "../../../common/src/types/Property";
import redis from "../services/redis";

export const uploadPictures = async (
  property: Property,
  files: string[],
  updateDb = true
): Promise<string[]> => {
  const images = await Promise.all(
    files.map(async (file) => {
      const imageId = randomUUID();
      const buffer = file.startsWith("http")
        ? await fetch(file).then((res) => res.arrayBuffer())
        : Buffer.from(file, "base64");
      await Promise.all([
        resize(buffer, IMAGE_PROPERTY_WIDTH).then((r) =>
          s3
            .getInstance("images")
            .put(
              r,
              S3_IMAGES_BUCKET,
              `${S3_IMAGES_PREFIX}/properties/${property.id}/${imageId}.webp`,
              "image/webp",
              true
            )
        ),
        resize(buffer, IMAGE_PROPERTY_THUMBNAIL_WIDTH).then((r) =>
          s3
            .getInstance("images")
            .put(
              r,
              S3_IMAGES_BUCKET,
              `${S3_IMAGES_PREFIX}/properties/${property.id}/${imageId}_thumbnail.webp`,
              "image/webp",
              true
            )
        ),
      ]);
      return imageId;
    })
  );

  if (updateDb) {
    await dal.update<Property>(`/items/properties/${property.id}`, {
      images: `${
        property.images != null ? property.images + "," : ""
      }${images.join(",")}`,
      updatedAt: new Date().toISOString(),
    });
  }
  await redis.remove(`marker:${property.id}`);
  return images;
};

export const rotatePicture = async (
  propertyId: string,
  pictureId: string,
  degrees: number,
  prop?: Property
): Promise<{
  imageId: string;
  prop: Property;
}> => {
  const property =
    prop ||
    (await dal
      .get<Property>(`/items/properties/${propertyId}`)
      .catch(() => null));
  if (!property) throw new Error("Property not found");
  const images = property.images.split(",");
  const index = images.indexOf(pictureId);
  if (index === -1) throw new Error("Image not found");
  const isPrimary = property.primaryImage === pictureId;

  const imageId = randomUUID();
  const s3Img = s3.getInstance("images");
  const url = `${s3Img.getServerUrl()}/properties/${propertyId}/${pictureId}.webp`;
  const url_thumbnail = `${s3Img.getServerUrl()}/properties/${propertyId}/${pictureId}_thumbnail.webp`;

  // This is to handle concurrent rotations
  await redis.save(
    `imageRotation:${propertyId}:${pictureId}`,
    { oldId: pictureId, newId: imageId },
    undefined,
    300
  );

  await Promise.all([
    rotate(url, degrees).then((r) =>
      s3Img.put(
        r,
        S3_IMAGES_BUCKET,
        `${S3_IMAGES_PREFIX}/properties/${propertyId}/${imageId}.webp`,
        "image/webp",
        true
      )
    ),
    rotate(url_thumbnail, degrees).then((r) =>
      s3Img.put(
        r,
        S3_IMAGES_BUCKET,
        `${S3_IMAGES_PREFIX}/properties/${propertyId}/${imageId}_thumbnail.webp`,
        "image/webp",
        true
      )
    ),
  ]);

  images[index] = imageId;

  // This is to handle concurrent rotations
  const concurrentRotations = (await redis.find(
    `imageRotation:${propertyId}:*`
  )) as { oldId: string; newId: string }[];
  let nImages: string = images.join(",");
  concurrentRotations.forEach(async ({ oldId, newId }) => {
    if (newId === imageId) return; // skip if it's this image
    nImages = nImages.replace(oldId, newId);
  });

  const updatedProp = await dal.update<Property>(
    `/items/properties/${propertyId}`,
    {
      images: nImages,
      primaryImage: isPrimary ? imageId : property.primaryImage,
      updatedAt: new Date().toISOString(),
    }
  );

  await Promise.all([
    s3Img.del(
      S3_IMAGES_BUCKET,
      `${S3_IMAGES_PREFIX}/properties/${propertyId}/${pictureId}.webp`
    ),
    s3Img.del(
      S3_IMAGES_BUCKET,
      `${S3_IMAGES_PREFIX}/properties/${propertyId}/${pictureId}_thumbnail.webp`
    ),
  ]).catch((err) => {
    console.log("Error deleting old image", err);
  });

  return {
    imageId,
    prop: updatedProp,
  };
};
