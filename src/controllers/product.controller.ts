import { Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import fs from 'fs';
import path from 'path';

export class ProductController {
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const productRepository = AppDataSource.getRepository(Product);
      const products = await productRepository.find({ relations: ['images'] });
      
      return res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  }

  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const productRepository = AppDataSource.getRepository(Product);
      const product = await productRepository.findOne({ 
        where: { id: parseInt(req.params.id) },
        relations: ['images']
      });

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product' });
    }
  }


  async createProduct(req: Request, res: Response): Promise<void> {
    try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

      const { sku, name, price } = req.body;
      const files = req.files as Express.Multer.File[];
      const imageAlts = req.body.imageAlts ? JSON.parse(req.body.imageAlts) : [];

      const productRepository = AppDataSource.getRepository(Product);
      const imageRepository = AppDataSource.getRepository(ProductImage);

      const product = productRepository.create({
        sku,
        name,
        price
      });

      const savedProduct = await productRepository.save(product);

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const image = imageRepository.create({
            filename: files[i].filename,
            altText: imageAlts[i] || '',
            productId: savedProduct.id
          });
          await imageRepository.save(image);
        }
      }

      const createdProduct = await productRepository.findOne({
        where: { id: savedProduct.id },
        relations: ['images']
      });

      res.status(201).json(createdProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ message: 'Error creating product', error: error.message });
    }
  }

  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { sku, name, price, keepImages } = req.body;
      const files = req.files as Express.Multer.File[];
      const imageAlts = req.body.imageAlts ? JSON.parse(req.body.imageAlts) : [];
      const imagesToKeep = keepImages ? JSON.parse(keepImages) : [];

      const productRepository = AppDataSource.getRepository(Product);
      const imageRepository = AppDataSource.getRepository(ProductImage);

      const product = await productRepository.findOne({
        where: { id },
        relations: ['images']
      });

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      product.sku = sku;
      product.name = name;
      product.price = price;
      await productRepository.save(product);

      
      for (const image of product.images) {
        if (!imagesToKeep.includes(image.id)) {
          try {
            fs.unlinkSync(path.join(__dirname, '../../uploads/', image.filename));
          } catch (err) {
            console.error(`Error deleting file ${image.filename}:`, err);
          }
          await imageRepository.delete(image.id);
        }
      }

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const image = imageRepository.create({
            filename: files[i].filename,
            altText: imageAlts[i] || '',
            productId: product.id
          });
          await imageRepository.save(image);
        }
      }

      const updatedProduct = await productRepository.findOne({
        where: { id },
        relations: ['images']
      });

      res.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product', error: error.message });
    }
  }

  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const productRepository = AppDataSource.getRepository(Product);
      const imageRepository = AppDataSource.getRepository(ProductImage);


      const product = await productRepository.findOne({
        where: { id },
        relations: ['images']
      });

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

  
      for (const image of product.images) {
        try {
          fs.unlinkSync(path.join(__dirname, '../../uploads/', image.filename));
        } catch (err) {
          console.error(`Error deleting file ${image.filename}:`, err);
        }
      }

      await productRepository.delete(id);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Error deleting product' });
    }
  }
}
