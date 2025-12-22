package fr.umontpellier.observability.service;

import fr.umontpellier.observability.exception.UserAlreadyExistsException;
import fr.umontpellier.observability.model.User;
import fr.umontpellier.observability.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private static final String USER_TOPIC = "user-events";

    public User createUser(User user) {
        log.info("Creating new user with email: {}", user.getEmail());

        if (userRepository.existsByEmail(user.getEmail())) {
            log.error("User already exists with email: {}", user.getEmail());
            throw new UserAlreadyExistsException(user.getEmail());
        }

        User savedUser = userRepository.save(user);

        // Publish event to Kafka
        kafkaTemplate.send(USER_TOPIC, "User created: " + savedUser.getId());
        log.info("User created successfully with id: {}", savedUser.getId());

        return savedUser;
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserById(String id) {
        log.info("Fetching user by id: {}", id);
        return userRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) {
        log.info("Fetching user by email: {}", email);
        return userRepository.findByEmail(email);
    }
}
