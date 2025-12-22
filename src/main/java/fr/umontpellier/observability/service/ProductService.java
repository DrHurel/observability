package fr.umontpellier.observability.service;

import fr.umontpellier.observability.exception.ProductAlreadyExistsException;
import fr.umontpellier.observability.exception.ProductNotFoundException;
import fr.umontpellier.observability.model.Product;
import fr.umontpellier.observability.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private static final String PRODUCT_TOPIC = "product-events";

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        log.info("Fetching all products");
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Product getProductById(String id) {
        log.info("Fetching product by id: {}", id);
        return productRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Product not found with id: {}", id);
                    return new ProductNotFoundException(id);
                });
    }

    public Product addProduct(Product product) {
        log.info("Adding new product: {}", product.getName());

        // Check if product with given ID already exists (if ID is provided)
        if (product.getId() != null && productRepository.existsById(product.getId())) {
            log.error("Product already exists with id: {}", product.getId());
            throw new ProductAlreadyExistsException(product.getId());
        }

        Product savedProduct = productRepository.save(product);

        // Publish event to Kafka
        kafkaTemplate.send(PRODUCT_TOPIC, "Product added: " + savedProduct.getId());
        log.info("Product added successfully with id: {}", savedProduct.getId());

        return savedProduct;
    }

    public void deleteProduct(String id) {
        log.info("Deleting product with id: {}", id);

        if (!productRepository.existsById(id)) {
            log.error("Product not found with id: {}", id);
            throw new ProductNotFoundException(id);
        }

        productRepository.deleteById(id);

        // Publish event to Kafka
        kafkaTemplate.send(PRODUCT_TOPIC, "Product deleted: " + id);
        log.info("Product deleted successfully with id: {}", id);
    }

    public Product updateProduct(String id, Product productDetails) {
        log.info("Updating product with id: {}", id);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Product not found with id: {}", id);
                    return new ProductNotFoundException(id);
                });

        product.setName(productDetails.getName());
        product.setPrice(productDetails.getPrice());
        product.setExpirationDate(productDetails.getExpirationDate());

        Product updatedProduct = productRepository.save(product);

        // Publish event to Kafka
        kafkaTemplate.send(PRODUCT_TOPIC, "Product updated: " + updatedProduct.getId());
        log.info("Product updated successfully with id: {}", updatedProduct.getId());

        return updatedProduct;
    }
}
