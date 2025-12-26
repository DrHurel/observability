# InjectLog4J

A library for automatic logging injection using [Spoon](https://spoon.gforge.inria.fr/) source code transformation. Annotate your methods with `@InjectLog` and define logging rules in a YAML configuration file.

## Features

- **Annotation-based**: Mark methods/classes with `@InjectLog` for automatic log injection
- **Declarative configuration**: Define logging rules in `logging.rules.yaml`
- **Uses project's Log4J2 config**: Integrates with your project's existing `log4j2.xml`
- **Multiple outputs**: Support for terminal (Log4J2), Kafka, and file outputs
- **Multiple file outputs**: Write to multiple log files simultaneously
- **Logger categories**: Organize loggers into categories (system, business)
- **Flexible triggers**: Log on method entry, return, or exception
- **Template messages**: Use placeholders like `{{time}}`, `{{value}}`, `{{args}}`
- **Wildcard matching**: Target multiple methods with pattern matching

## Important: Log4J2 Configuration

**This library uses the Log4J2 configuration from your project.** Make sure your project has a `log4j2.xml` file. The `log4jLogger` property in `logging.rules.yaml` references loggers defined in your `log4j2.xml`.

## Quick Start

### 1. Add Dependency

```xml
<dependency>
    <groupId>fr.umontpellier</groupId>
    <artifactId>inject-log4j</artifactId>
    <version>0.0.1-SNAPSHOT</version>
</dependency>
```

### 2. Configure Log4J2 in Your Project

Create or update `src/main/resources/log4j2.xml` in your project:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
    <Appenders>
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="%d{HH:mm:ss.SSS} [%t] %-5level %logger{36} - %msg%n"/>
        </Console>
    </Appenders>
    <Loggers>
        <!-- Logger for InjectLog4J system logs -->
        <Logger name="fr.umontpellier.system" level="info" additivity="false">
            <AppenderRef ref="Console"/>
        </Logger>
        <!-- Logger for business logs -->
        <Logger name="fr.umontpellier.business" level="info" additivity="false">
            <AppenderRef ref="Console"/>
        </Logger>
        <Root level="info">
            <AppenderRef ref="Console"/>
        </Root>
    </Loggers>
</Configuration>
```

### 3. Annotate Your Code

```java
import fr.umontpellier.injectlog4j.annotation.InjectLog;

@InjectLog
public class UserService {
    
    @InjectLog(id = "user.create")
    public User createUser(String name, String email) {
        // Your business logic
        return new User(name, email);
    }
}
```

### 4. Create `logging.rules.yaml`

Place this file in `src/main/resources/logging.rules.yaml`:

```yaml
# Logger Categories:
# - system: Infrastructure, configuration, and technical operations
# - business: Business logic, user actions, and domain operations

loggers:
  # System logger - for infrastructure and technical operations
  system:
    output: terminal
    log4jLogger: fr.umontpellier.system
    format: "{{time}} [SYSTEM] [{{class}}.{{method}}] {{message}}"
    category: system
    files:
      - path: logs/system.log
        format: "{{time}} [{{level}}] {{message}}"
        append: true
        maxSize: 10MB
        maxFiles: 5

  # Business logger - for business logic and domain operations
  business:
    output: terminal
    log4jLogger: fr.umontpellier.business
    format: "{{time}} [BUSINESS] [{{class}}.{{method}}] {{message}}"
    category: business
    files:
      - path: logs/business.log
        format: "{{time}} [{{level}}] {{message}}"
      - path: logs/all.log
        format: "{{time}} [{{category}}] {{message}}"

rules:
  - target: user.create
    criticality: INFO
    why: [OnReturn, OnException]
    message: "User created: {{value}}"
    logger: business

  - target: com.example.config.*
    criticality: INFO
    why: [OnEntry]
    message: "Configuration initialized"
    logger: system
```

### 5. Initialize at Runtime

```java
public class Application {
    public static void main(String[] args) {
        // Initialize the log injector
        InjectLog4J.initialize();
        
        // Your application code...
        
        // Shutdown when done
        InjectLog4J.shutdown();
    }
}
```

## Configuration Reference

### Loggers

| Property | Description | Required |
|----------|-------------|----------|
| `output` | Output type: `terminal`, `log4j2`, `console`, `kafka`, or `file` | Yes |
| `format` | Message format with placeholders | Yes |
| `log4jLogger` | Log4J2 logger name from your project's `log4j2.xml` | No (for terminal/log4j2) |
| `bootstrapServers` | Kafka bootstrap servers (for kafka output) | No |
| `topic` | Kafka topic name (for kafka output) | No |
| `category` | Logger category: `system` or `business` | No |
| `files` | List of file output configurations (see below) | No |

**Note:** For `terminal`/`log4j2`/`console` output, the `log4jLogger` property lets you specify which Log4J2 logger to use from your project's configuration. This allows you to leverage your existing appenders, log levels, and formatting.

### Logger Categories

Use categories to organize your loggers by purpose:

- **system**: For infrastructure, configuration, and technical operations (startup, shutdown, connections, errors)
- **business**: For business logic, user actions, and domain operations (user creation, transactions, data changes)

Categories replace the old error/debug/warn distinction since criticality (log level) is defined per-rule, not per-logger.

### File Outputs

Each logger can write to multiple files simultaneously using the `files` array:

| Property | Description | Required | Default |
|----------|-------------|----------|---------|
| `path` | File path (relative to project root or absolute) | Yes | - |
| `format` | Message format with placeholders | No | Uses logger format |
| `append` | Append to existing file (true) or overwrite (false) | No | `true` |
| `maxSize` | Maximum file size before rotation (e.g., `10MB`, `1GB`) | No | unlimited |
| `maxFiles` | Maximum number of rotated files to keep | No | 5 |

**Example with multiple file outputs:**

```yaml
loggers:
  business:
    output: terminal
    log4jLogger: fr.umontpellier.business
    format: "{{time}} [BUSINESS] {{message}}"
    category: business
    files:
      - path: logs/business.log
        format: "{{time}} [{{level}}] {{message}}"
        maxSize: 10MB
        maxFiles: 10
      - path: logs/all-events.log
        format: "{{time}} [{{category}}] [{{class}}.{{method}}] {{message}}"
```

### Rules

| Property | Description | Required |
|----------|-------------|----------|
| `target` | Method identifier or pattern (supports `*` wildcards) | Yes |
| `criticality` | Log level: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR` | Yes |
| `why` | List of triggers: `OnEntry`, `OnReturn`, `OnException` | Yes |
| `message` | Log message template | Yes |
| `logger` | Name of the logger to use | Yes |

### Placeholders

| Placeholder | Description |
|-------------|-------------|
| `{{time}}` | Current timestamp |
| `{{message}}` | The configured message |
| `{{value}}` | Return value or exception message |
| `{{method}}` | Method name |
| `{{class}}` | Class name |
| `{{args}}` | Method arguments |
| `{{exception}}` | Exception details |
| `{{level}}` | Log level (TRACE, DEBUG, INFO, WARN, ERROR) |
| `{{category}}` | Logger category (system, business) |

## Build-Time Processing (Maven Plugin)

To transform source code at build time:

```xml
<plugin>
    <groupId>fr.umontpellier</groupId>
    <artifactId>inject-log4j</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <executions>
        <execution>
            <phase>process-sources</phase>
            <goals>
                <goal>inject-log</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

## Programmatic Usage

```java
import fr.umontpellier.injectlog4j.InjectLog4J;
import java.nio.file.Path;

// Process source files
InjectLog4J.processProject(
    Path.of("src/main/java"),
    Path.of("target/generated-sources"),
    Path.of("src/main/resources/logging.rules.yaml")
);
```

## Building

```bash
cd InjectLog4J
mvn clean install
```

## License

This project is part of the Observability project.
