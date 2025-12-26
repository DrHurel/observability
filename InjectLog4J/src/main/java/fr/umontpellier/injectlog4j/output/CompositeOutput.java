package fr.umontpellier.injectlog4j.output;

import java.util.ArrayList;
import java.util.List;

/**
 * LogOutput implementation that writes to multiple outputs simultaneously.
 * 
 * <p>
 * This allows a single logger to write to terminal, file(s), and other
 * destinations at the same time.
 * </p>
 */
public class CompositeOutput implements LogOutput {

    private final List<LogOutput> outputs = new ArrayList<>();

    public CompositeOutput() {
    }

    public CompositeOutput(List<LogOutput> outputs) {
        if (outputs != null) {
            this.outputs.addAll(outputs);
        }
    }

    /**
     * Add an output to the composite.
     * 
     * @param output the output to add
     */
    public void addOutput(LogOutput output) {
        if (output != null) {
            outputs.add(output);
        }
    }

    /**
     * Remove an output from the composite.
     * 
     * @param output the output to remove
     */
    public void removeOutput(LogOutput output) {
        outputs.remove(output);
    }

    /**
     * Get the number of outputs in this composite.
     * 
     * @return the number of outputs
     */
    public int size() {
        return outputs.size();
    }

    /**
     * Check if this composite has any outputs.
     * 
     * @return true if there are outputs
     */
    public boolean isEmpty() {
        return outputs.isEmpty();
    }

    @Override
    public void log(String level, String message) {
        for (LogOutput output : outputs) {
            try {
                output.log(level, message);
            } catch (Exception e) {
                // Log to stderr but don't fail the other outputs
                System.err.println("Failed to write to output: " + e.getMessage());
            }
        }
    }

    @Override
    public void close() {
        for (LogOutput output : outputs) {
            try {
                output.close();
            } catch (Exception e) {
                // Ignore close errors
            }
        }
        outputs.clear();
    }
}
