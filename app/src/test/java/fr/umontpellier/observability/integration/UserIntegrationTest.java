package fr.umontpellier.observability.integration;

import fr.umontpellier.observability.model.User;
import fr.umontpellier.observability.repository.UserRepository;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class UserIntegrationTest {

    @Container
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.6.0"));

    @Container
    static MongoDBContainer mongodb = new MongoDBContainer(DockerImageName.parse("mongo:7.0"));

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.data.mongodb.uri", mongodb::getReplicaSetUrl);
    }

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldCreateUser() throws Exception {
        // Given
        String userJson = """
                {
                    "name": "John Doe",
                    "age": 30,
                    "email": "john.doe@example.com",
                    "password": "securePassword123"
                }
                """;

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(userJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("John Doe")))
                .andExpect(jsonPath("$.email", is("john.doe@example.com")))
                .andExpect(jsonPath("$.age", is(30)));
    }

    @Test
    void shouldThrowExceptionWhenCreatingDuplicateUser() throws Exception {
        // Given
        User user = new User(null, "Jane Doe", 25, "jane.doe@example.com", "password123");
        userRepository.save(user);

        String duplicateUserJson = """
                {
                    "name": "Jane Smith",
                    "age": 28,
                    "email": "jane.doe@example.com",
                    "password": "anotherPassword"
                }
                """;

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(duplicateUserJson))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    void shouldGetAllUsers() throws Exception {
        // Given
        User user1 = new User(null, "Alice", 28, "alice@example.com", "pass1");
        User user2 = new User(null, "Bob", 35, "bob@example.com", "pass2");
        userRepository.save(user1);
        userRepository.save(user2);

        // When & Then
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void shouldGetUserById() throws Exception {
        // Given
        User user = new User(null, "Charlie", 40, "charlie@example.com", "password");
        User saved = userRepository.save(user);

        // When & Then
        mockMvc.perform(get("/api/users/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Charlie")))
                .andExpect(jsonPath("$.email", is("charlie@example.com")));
    }

    @Test
    void shouldReturnNotFoundWhenUserDoesNotExist() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/users/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldGetUserByEmail() throws Exception {
        // Given
        User user = new User(null, "David", 32, "david@example.com", "password");
        userRepository.save(user);

        // When & Then
        mockMvc.perform(get("/api/users/email/david@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("David")))
                .andExpect(jsonPath("$.age", is(32)));
    }

    @Test
    void shouldValidateUserFields() throws Exception {
        // Given - User with invalid data
        String invalidUserJson = """
                {
                    "name": "",
                    "age": -5,
                    "email": "invalid-email",
                    "password": ""
                }
                """;

        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidUserJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").exists());
    }
}
