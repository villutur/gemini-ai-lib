import assert from "node:assert/strict";
import test from "node:test";
import {
  PersonGeneration,
  getImageModelCapabilities,
  getImageModelConfigOptions,
} from "../src/index.ts";

test("image capability metadata keeps gemini-2.5-flash-image conservative", () => {
  const capabilities = getImageModelCapabilities("gemini-2.5-flash-image");

  assert.deepEqual(capabilities.allowedImageSizes, ["1K"]);
  assert.deepEqual(capabilities.allowedAspectRatios, [
    "1:1",
    "2:3",
    "3:2",
    "3:4",
    "4:3",
    "4:5",
    "5:4",
    "9:16",
    "16:9",
    "21:9",
  ]);
  assert.equal(capabilities.supportedOptions.includes("outputMimeType"), false);
  assert.equal(capabilities.supportedOptions.includes("compressionQuality"), false);
});

test("image capability metadata keeps Gemini and Imagen option surfaces distinct", () => {
  const geminiOptions = getImageModelConfigOptions("gemini-3.1-flash-image-preview");
  const imagenOptions = getImageModelConfigOptions("imagen-4.0-generate-001");

  assert.equal(geminiOptions.some((option) => option.key === "outputMimeType"), false);
  assert.equal(geminiOptions.some((option) => option.key === "compressionQuality"), false);

  const geminiSizeOption = geminiOptions.find((option) => option.key === "imageSize");
  assert.deepEqual(geminiSizeOption?.allowedValues, ["512", "1K", "2K", "4K"]);

  const imagenSizeOption = imagenOptions.find((option) => option.key === "imageSize");
  const imagenMimeOption = imagenOptions.find((option) => option.key === "outputMimeType");
  assert.deepEqual(imagenSizeOption?.allowedValues, ["1K", "2K"]);
  assert.deepEqual(imagenMimeOption?.allowedValues, ["image/jpeg", "image/png"]);
});

test("curated image-related SDK exports are available from the package root", () => {
  assert.equal(PersonGeneration.ALLOW_ALL, "ALLOW_ALL");
  assert.equal(PersonGeneration.ALLOW_ADULT, "ALLOW_ADULT");
  assert.equal(PersonGeneration.DONT_ALLOW, "DONT_ALLOW");
});
