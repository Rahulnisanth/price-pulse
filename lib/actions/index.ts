"use server";
import Product from "../models/product.model";
import { connect_to_database } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import { User } from "../types";
import { getLowestPrice, getHighestPrice, getAveragePrice } from "../utils";
import { revalidatePath } from "next/cache";
import { generateEmailContent, sendEmail } from "../nodemailer";

export async function ScrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;

  try {
    await connect_to_database();

    const scrapedProduct = await scrapeAmazonProduct(productUrl);

    if (!scrapedProduct) return;

    let product = scrapedProduct;
    const existingProduct = await Product.findOne({ url: product.url });

    if (existingProduct) {
      const updatedPriceHistory = [
        ...(existingProduct.priceHistory || []),
        { price: scrapedProduct.currentPrice },
      ];
      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );

    if (newProduct) {
      revalidatePath(`/products/${newProduct._id}`);
    }
  } catch (err: any) {
    throw new Error(`Failed to create/update product: ${err.message}`);
  }
}

export async function getProductById(productId: string) {
  try {
    await connect_to_database();
    const product = await Product.findOne({ _id: productId });
    if (!product) return "No product found!";
    return product;
  } catch (err) {
    console.log(err);
  }
}

export async function getAllProducts() {
  try {
    await connect_to_database();
    const products = await Product.find();
    if (!products) return [];
    return products;
  } catch (err) {
    console.log(err);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    await connect_to_database();
    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(4);
    if (!similarProducts) return [];
    return similarProducts;
  } catch (err) {
    console.log(err);
  }
}

export async function addUserEmailToProduct(
  productId: string,
  userEmail: string
) {
  try {
    const product = await Product.findById(productId);
    if (!product) return;
    const userExists = product.users.some(
      (user: User) => user.email == userEmail
    );
    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();
      const emailContent = await generateEmailContent(product, "WELCOME");
      await sendEmail(emailContent, [userEmail]);
    }
  } catch (err) {
    console.log(err);
  }
}
