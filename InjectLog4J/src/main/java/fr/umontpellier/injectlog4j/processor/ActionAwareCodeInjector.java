package fr.umontpellier.injectlog4j.processor;

import spoon.reflect.code.*;
import spoon.reflect.declaration.CtMethod;
import spoon.reflect.declaration.CtParameter;
import spoon.reflect.factory.Factory;

import java.util.List;

/**
 * Extended CodeInjector that also injects action recording calls for user
 * profiling.
 * This extends DefaultCodeInjector and adds ActionInjector calls alongside
 * logging.
 */
public class ActionAwareCodeInjector implements CodeInjector {

    private static final String LOG_INJECTOR_CLASS = "fr.umontpellier.injectlog4j.runtime.LogInjector";
    private static final String ACTION_INJECTOR_CLASS = "fr.umontpellier.injectlog4j.action.ActionInjector";

    private final boolean actionRecordingEnabled;

    public ActionAwareCodeInjector() {
        this(true);
    }

    public ActionAwareCodeInjector(boolean actionRecordingEnabled) {
        this.actionRecordingEnabled = actionRecordingEnabled;
    }

    @Override
    public CtStatement createEntryLogStatement(Factory factory, String target, String className,
            String methodName, List<CtParameter<?>> parameters) {
        String argsArray = createArgsArray(parameters);

        StringBuilder code = new StringBuilder();

        // Log injection
        code.append(String.format(
                "%s.getInstance().logEntry(\"%s\", \"%s\", \"%s\", %s)",
                LOG_INJECTOR_CLASS, target, className, methodName, argsArray));

        // Action recording (if enabled)
        if (actionRecordingEnabled && shouldRecordAction(className, methodName)) {
            code.append("; ");
            code.append(String.format(
                    "%s.getInstance().recordEntry(\"%s\", \"%s\", %s)",
                    ACTION_INJECTOR_CLASS, className, methodName, argsArray));
        }

        return factory.createCodeSnippetStatement(code.toString());
    }

    @Override
    public void wrapReturnStatements(Factory factory, CtMethod<?> method, String target,
            String className, String methodName) {
        CtBlock<?> body = method.getBody();
        if (body == null) {
            return;
        }

        String argsArray = createArgsArray(method.getParameters());
        List<CtReturn<?>> returns = body.getElements(CtReturn.class::isInstance);

        for (CtReturn<?> ret : returns) {
            CtExpression<?> returnValue = ret.getReturnedExpression();

            if (returnValue != null) {
                wrapNonVoidReturn(factory, ret, target, className, methodName, argsArray, returnValue);
            } else {
                wrapVoidReturn(factory, ret, target, className, methodName, argsArray);
            }
        }

        // Handle implicit returns (void methods without explicit return)
        if (returns.isEmpty()) {
            addImplicitReturnLog(factory, body, target, className, methodName, argsArray);
        }
    }

    private void wrapNonVoidReturn(Factory factory, CtReturn<?> ret, String target,
            String className, String methodName, String argsArray, CtExpression<?> returnValue) {
        String tempVarName = "__injectlog_result_" + System.nanoTime();
        String returnType = returnValue.getType() != null
                ? returnValue.getType().getQualifiedName()
                : "Object";

        String varDecl = String.format("%s %s = %s",
                returnType.contains("<") ? "var" : returnType,
                tempVarName,
                returnValue.toString());

        String logCode = String.format(
                "%s.getInstance().logReturn(\"%s\", \"%s\", \"%s\", %s, %s)",
                LOG_INJECTOR_CLASS, target, className, methodName, argsArray, tempVarName);

        CtBlock<?> replacementBlock = factory.createBlock();
        replacementBlock.addStatement(factory.createCodeSnippetStatement(varDecl));
        replacementBlock.addStatement(factory.createCodeSnippetStatement(logCode));

        // Action recording (if enabled)
        if (actionRecordingEnabled && shouldRecordAction(className, methodName)) {
            String actionCode = String.format(
                    "%s.getInstance().recordReturn(\"%s\", \"%s\", %s, %s)",
                    ACTION_INJECTOR_CLASS, className, methodName, argsArray, tempVarName);
            replacementBlock.addStatement(factory.createCodeSnippetStatement(actionCode));
        }

        replacementBlock.addStatement(factory.createCodeSnippetStatement("return " + tempVarName));

        ret.replace(replacementBlock);
    }

    private void wrapVoidReturn(Factory factory, CtReturn<?> ret, String target,
            String className, String methodName, String argsArray) {
        String logCode = String.format(
                "%s.getInstance().logReturn(\"%s\", \"%s\", \"%s\", %s, null)",
                LOG_INJECTOR_CLASS, target, className, methodName, argsArray);

        ret.insertBefore(factory.createCodeSnippetStatement(logCode));

        // Action recording (if enabled)
        if (actionRecordingEnabled && shouldRecordAction(className, methodName)) {
            String actionCode = String.format(
                    "%s.getInstance().recordReturn(\"%s\", \"%s\", %s, null)",
                    ACTION_INJECTOR_CLASS, className, methodName, argsArray);
            ret.insertBefore(factory.createCodeSnippetStatement(actionCode));
        }
    }

    private void addImplicitReturnLog(Factory factory, CtBlock<?> body, String target,
            String className, String methodName, String argsArray) {
        String logCode = String.format(
                "%s.getInstance().logReturn(\"%s\", \"%s\", \"%s\", %s, null)",
                LOG_INJECTOR_CLASS, target, className, methodName, argsArray);
        body.addStatement(factory.createCodeSnippetStatement(logCode));

        // Action recording (if enabled)
        if (actionRecordingEnabled && shouldRecordAction(className, methodName)) {
            String actionCode = String.format(
                    "%s.getInstance().recordReturn(\"%s\", \"%s\", %s, null)",
                    ACTION_INJECTOR_CLASS, className, methodName, argsArray);
            body.addStatement(factory.createCodeSnippetStatement(actionCode));
        }
    }

    @Override
    public void wrapWithExceptionLogging(Factory factory, CtMethod<?> method, String target,
            String className, String methodName) {
        CtBlock<?> body = method.getBody();
        if (body == null || body.getStatements().isEmpty()) {
            return;
        }

        String argsArray = createArgsArray(method.getParameters());

        // Create try block
        CtTry tryBlock = factory.createTry();
        CtBlock<?> tryBody = factory.createBlock();

        for (CtStatement stmt : body.getStatements()) {
            tryBody.addStatement(stmt.clone());
        }
        tryBlock.setBody(tryBody);

        // Create catch block
        CtCatch catchBlock = createCatchBlock(factory, target, className, methodName, argsArray);
        tryBlock.addCatcher(catchBlock);

        // Replace body
        body.getStatements().clear();
        body.addStatement(tryBlock);
    }

    private CtCatch createCatchBlock(Factory factory, String target, String className,
            String methodName, String argsArray) {
        CtCatch catchBlock = factory.createCatch();

        CtCatchVariable<Throwable> catchVar = factory.createCatchVariable();
        catchVar.setSimpleName("__injectlog_exception");
        catchVar.setType(factory.createCtTypeReference(Throwable.class));
        catchBlock.setParameter(catchVar);

        CtBlock<?> catchBody = factory.createBlock();

        String exceptionLogCode = String.format(
                "%s.getInstance().logException(\"%s\", \"%s\", \"%s\", %s, __injectlog_exception)",
                LOG_INJECTOR_CLASS, target, className, methodName, argsArray);
        catchBody.addStatement(factory.createCodeSnippetStatement(exceptionLogCode));

        // Action recording (if enabled)
        if (actionRecordingEnabled && shouldRecordAction(className, methodName)) {
            String actionCode = String.format(
                    "%s.getInstance().recordException(\"%s\", \"%s\", %s, __injectlog_exception)",
                    ACTION_INJECTOR_CLASS, className, methodName, argsArray);
            catchBody.addStatement(factory.createCodeSnippetStatement(actionCode));
        }

        catchBody.addStatement(factory.createCodeSnippetStatement("throw __injectlog_exception"));

        catchBlock.setBody(catchBody);
        return catchBlock;
    }

    @Override
    public String createArgsArray(List<CtParameter<?>> parameters) {
        if (parameters.isEmpty()) {
            return "new Object[]{}";
        }

        StringBuilder sb = new StringBuilder("new Object[]{");
        for (int i = 0; i < parameters.size(); i++) {
            if (i > 0) {
                sb.append(", ");
            }
            sb.append(parameters.get(i).getSimpleName());
        }
        sb.append("}");
        return sb.toString();
    }

    /**
     * Determine if action recording should be performed for this class/method.
     * Override this method to customize which methods are recorded.
     */
    protected boolean shouldRecordAction(String className, String methodName) {
        // Record actions for Service classes by default
        if (className == null) {
            return false;
        }

        String lowerClass = className.toLowerCase();
        return lowerClass.contains("service") ||
                lowerClass.contains("controller") ||
                lowerClass.contains("repository");
    }
}
