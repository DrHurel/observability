package fr.umontpellier.observability;

import fr.umontpellier.injectlog4j.InjectLog4J;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ObservabilityApplication {

	public static void main(String[] args) {
		// Initialize InjectLog4J logging framework
		InjectLog4J.initialize();
		
		SpringApplication.run(ObservabilityApplication.class, args);
	}

	@PreDestroy
	public void onShutdown() {
		// Cleanup InjectLog4J resources
		InjectLog4J.shutdown();
	}
}
