package fr.umontpellier.observability.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.umontpellier.observability.exception.ProductAlreadyExistsException;
import fr.umontpellier.observability.exception.ProductNotFoundException;
import fr.umontpellier.observability.model.Product;
import fr.umontpellier.observability.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
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

        // Publish event to Kafka with JSON data
        publishProductEvent("PRODUCT_ADDED", savedProduct);

        return savedProduct;
    }

    public void deleteProduct(String id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }

        productRepository.deleteById(id);

        // Publish event to Kafka
        publishProductEvent("PRODUCT_DELETED", id, null, BigDecimal.ZERO);
    }

    public Product updateProduct(String id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        product.setName(productDetails.getName());
        product.setPrice(productDetails.getPrice());
        product.setExpirationDate(productDetails.getExpirationDate());

        Product updatedProduct = productRepository.save(product);

        // Publish event to Kafka with JSON data
        publishProductEvent("PRODUCT_UPDATED", updatedProduct);

        return updatedProduct;
    }

    private void publishProductEvent(String eventType, Product product) {
        publishProductEvent(eventType, product.getId(), product.getName(), product.getPrice());
    }

    private void publishProductEvent(String eventType, String productId, String productName, BigDecimal price) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("event_type", eventType);
            event.put("product_id", productId);
            event.put("product_name", productName != null ? productName : "");
            event.put("product_price", price != null ? price.doubleValue() : 0.0);
            event.put("timestamp", System.currentTimeMillis());
            kafkaTemplate.send(PRODUCT_TOPIC, objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            // Exception logging handled by InjectLog4J via logging.rules.yaml
        }
    }
}
