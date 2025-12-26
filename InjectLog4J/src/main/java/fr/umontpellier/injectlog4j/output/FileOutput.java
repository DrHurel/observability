package fr.umontpellier.injectlog4j.output;

import fr.umontpellier.injectlog4j.config.LoggerConfig;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.locks.ReentrantLock;

/**
 * LogOutput implementation that writes logs to a file.
 * 
 * <p>
 * Supports:
 * - Append mode (default) or overwrite mode
 * - Thread-safe writing
 * - Automatic directory creation
 * </p>
 */
public class FileOutput implements LogOutput {

    private final String filePath;
    private final boolean append;
    private final ReentrantLock lock = new ReentrantLock();
    private PrintWriter writer;
    private boolean initialized = false;

    public FileOutput(String filePath) {
        this(filePath, true);
    }

    public FileOutput(String filePath, boolean append) {
        this.filePath = filePath;
        this.append = append;
    }

    public FileOutput(LoggerConfig.FileConfig fileConfig) {
        this.filePath = fileConfig.getPath();
        this.append = fileConfig.isAppend();
    }

    private void initialize() {
        if (initialized) {
            return;
        }

        lock.lock();
        try {
            if (initialized) {
                return;
            }

            // Create parent directories if they don't exist
            Path path = Paths.get(filePath);
            Path parent = path.getParent();
            if (parent != null && !Files.exists(parent)) {
                Files.createDirectories(parent);
            }

            writer = new PrintWriter(new BufferedWriter(new FileWriter(filePath, append)), true);
            initialized = true;
        } catch (IOException e) {
            System.err.println("Failed to initialize file output for " + filePath + ": " + e.getMessage());
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void log(String level, String message) {
        if (!initialized) {
            initialize();
        }

        if (writer == null) {
            return;
        }

        lock.lock();
        try {
            writer.println(message);
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void close() {
        lock.lock();
        try {
            if (writer != null) {
                writer.close();
                writer = null;
                initialized = false;
            }
        } finally {
            lock.unlock();
        }
    }

    public String getFilePath() {
        return filePath;
    }
}
