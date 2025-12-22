package fr.umontpellier.observability.integration;

import fr.umontpellier.observability.model.Product;
import fr.umontpellier.observability.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class ProductIntegrationTest {

    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

    @Container
    static MongoDBContainer mongodb = new MongoDBContainer(DockerImageName.parse("mongo:7.0"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.data.mongodb.uri", mongodb::getReplicaSetUrl);
    }

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
    }

    @Test
    void shouldGetAllProducts() throws Exception {
        // Given
        Product product = new Product(null, "Test Product", new BigDecimal("29.99"), LocalDate.now().plusDays(30));
        productRepository.save(product);

        // When & Then
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Test Product")));
    }

    @Test
    void shouldGetProductById() throws Exception {
        // Given
        Product product = new Product(null, "Test Product", new BigDecimal("29.99"), LocalDate.now().plusDays(30));
        Product saved = productRepository.save(product);

        // When & Then
        mockMvc.perform(get("/api/products/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test Product")))
                .andExpect(jsonPath("$.price", is(29.99)));
    }

    @Test
    void shouldThrowExceptionWhenProductNotFound() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/products/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Product not found")));
    }

    @Test
    void shouldAddNewProduct() throws Exception {
        // Given
        String productJson = """
                {
                    "name": "New Product",
                    "price": 49.99,
                    "expirationDate": "2025-12-31"
                }
                """;

        // When & Then
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("New Product")))
                .andExpect(jsonPath("$.price", is(49.99)));
    }

    @Test
    void shouldThrowExceptionWhenAddingProductWithExistingId() throws Exception {
        // Given
        Product product = new Product(null, "Existing Product", new BigDecimal("19.99"), LocalDate.now().plusDays(30));
        Product saved = productRepository.save(product);

        String productJson = String.format("""
                {
                    "id": "%s",
                    "name": "Duplicate Product",
                    "price": 29.99,
                    "expirationDate": "2026-01-01"
                }
                """, saved.getId());

        // When & Then
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(productJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    void shouldUpdateProduct() throws Exception {
        // Given
        Product product = new Product(null, "Original Product", new BigDecimal("29.99"), LocalDate.now().plusDays(30));
        Product saved = productRepository.save(product);

        String updatedJson = """
                {
                    "name": "Updated Product",
                    "price": 39.99,
                    "expirationDate": "2026-01-01"
                }
                """;

        // When & Then
        mockMvc.perform(put("/api/products/" + saved.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatedJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Updated Product")))
                .andExpect(jsonPath("$.price", is(39.99)));
    }

    @Test
    void shouldThrowExceptionWhenUpdatingNonExistentProduct() throws Exception {
        // Given
        String updatedJson = """
                {
                    "name": "Updated Product",
                    "price": 39.99,
                    "expirationDate": "2026-01-01"
                }
                """;

        // When & Then
        mockMvc.perform(put("/api/products/999")
                .contentType(MediaType.APPLICATION_JSON)
                .content(updatedJson))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Product not found")));
    }

    @Test
    void shouldDeleteProduct() throws Exception {
        // Given
        Product product = new Product(null, "Product To Delete", new BigDecimal("19.99"), LocalDate.now().plusDays(30));
        Product saved = productRepository.save(product);

        // When & Then
        mockMvc.perform(delete("/api/products/" + saved.getId()))
                .andExpect(status().isNoContent());

        // Verify deletion
        mockMvc.perform(get("/api/products/" + saved.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldThrowExceptionWhenDeletingNonExistentProduct() throws Exception {
        // When & Then
        mockMvc.perform(delete("/api/products/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Product not found")));
    }

    @Test
    void shouldValidateProductFields() throws Exception {
        // Given - Product with invalid data
        String invalidProductJson = """
                {
                    "name": "",
                    "price": -10,
                    "expirationDate": null
                }
                """;

        // When & Then
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidProductJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }
}
