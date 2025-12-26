package fr.umontpellier.observability.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.umontpellier.observability.exception.UserAlreadyExistsException;
import fr.umontpellier.observability.model.User;
import fr.umontpellier.observability.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Log4j2
public class UserService {

    private final UserRepository userRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private static final String USER_TOPIC = "user-events";

    public User createUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new UserAlreadyExistsException(user.getEmail());
        }

        User savedUser = userRepository.save(user);

        // Publish event to Kafka with JSON data
        publishUserEvent("USER_CREATED", savedUser);

        return savedUser;
    }

    private void publishUserEvent(String eventType, User user) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("event_type", eventType);
            event.put("user_id", user.getId());
            event.put("user_name", user.getName());
            event.put("user_email", user.getEmail());
            event.put("timestamp", System.currentTimeMillis());
            kafkaTemplate.send(USER_TOPIC, objectMapper.writeValueAsString(event));
        } catch (Exception e) {
            log.warn("Failed to publish user event: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
