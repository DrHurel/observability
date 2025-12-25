package fr.umontpellier.observability.service;

import fr.umontpellier.observability.exception.ProductAlreadyExistsException;
import fr.umontpellier.observability.exception.ProductNotFoundException;
import fr.umontpellier.observability.model.Product;
import fr.umontpellier.observability.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private static final String PRODUCT_TOPIC = "product-events";

    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
    }

    public Product addProduct(Product product) {
        // Check if product with given ID already exists (if ID is provided)
        if (product.getId() != null && productRepository.existsById(product.getId())) {
            throw new ProductAlreadyExistsException(product.getId());
        }

        Product savedProduct = productRepository.save(product);

        // Publish event to Kafka
        kafkaTemplate.send(PRODUCT_TOPIC, "Product added: " + savedProduct.getId());

        return savedProduct;
    }

    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }

        productRepository.deleteById(id);

        // Publish event to Kafka
        kafkaTemplate.send(PRODUCT_TOPIC, "Product deleted: " + id);
    }

    public Product updateProduct(String id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        product.setName(productDetails.getName());
        product.setPrice(productDetails.getPrice());
        product.setExpirationDate(productDetails.getExpirationDate());

        Product updatedProduct = productRepository.save(product);

        // Publish event to Kafka
        kafkaTemplate.send(PRODUCT_TOPIC, "Product updated: " + updatedProduct.getId());

        return updatedProduct;
    }
}
