package fr.umontpellier.observability.config;

import fr.umontpellier.injectlog4j.action.ActionInjector;
import fr.umontpellier.injectlog4j.action.ActionRecorder;
import fr.umontpellier.observability.service.UserProfileService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration that integrates InjectLog4J's ActionInjector with the app's
 * UserProfileService.
 * 
 * This creates a custom ActionRecorder that directly calls UserProfileService
 * to record actions, avoiding the need for Kafka intermediate storage.
 */
@Configuration
@RequiredArgsConstructor
@Log4j2
public class ActionRecorderConfig {

    private final UserProfileService userProfileService;

    @PostConstruct
    public void init() {
        log.info("Initializing ActionRecorder integration with UserProfileService");
        ActionInjector.initialize(new ProfileServiceActionRecorder(userProfileService));
    }

    @PreDestroy
    public void cleanup() {
        ActionInjector.reset();
    }

    /**
     * ActionRecorder that directly updates user profiles via UserProfileService.
     */
    private static class ProfileServiceActionRecorder implements ActionRecorder {

        private final UserProfileService userProfileService;

        public ProfileServiceActionRecorder(UserProfileService userProfileService) {
            this.userProfileService = userProfileService;
        }

        @Override
        public void recordAction(fr.umontpellier.injectlog4j.action.UserAction action) {
            if (action == null) {
                return;
            }

            try {
                // Convert InjectLog4J's UserAction to app's UserAction
                fr.umontpellier.observability.model.UserAction appAction = convertAction(action);

                // Record in UserProfileService
                userProfileService.recordAction(appAction);

            } catch (Exception e) {
                // Log but don't fail - action recording is non-critical
                System.err.println("Failed to record action for profiling: " + e.getMessage());
            }
        }

        private fr.umontpellier.observability.model.UserAction convertAction(
                fr.umontpellier.injectlog4j.action.UserAction action) {

            fr.umontpellier.observability.model.UserAction.OperationType opType = convertOperationType(
                    action.getOperationType());

            fr.umontpellier.observability.model.UserAction.EntityType entityType = convertEntityType(
                    action.getEntityType());

            return fr.umontpellier.observability.model.UserAction.lpsBuilder()
                    .withTimestamp(action.getTimestamp())
                    .withUser(action.getUserId(), action.getUserEmail(), action.getUserName())
                    .withAction(opType, action.getClassName(), action.getMethodName())
                    .withTarget(entityType, action.getEntityId())
                    .withProductContext(action.getProductName(), action.getProductPrice())
                    .withResult(action.isSuccessful(), action.getErrorMessage())
                    .build();
        }

        private fr.umontpellier.observability.model.UserAction.OperationType convertOperationType(
                fr.umontpellier.injectlog4j.action.UserAction.OperationType opType) {
            if (opType == null) {
                return fr.umontpellier.observability.model.UserAction.OperationType.GET_ALL;
            }
            String name = opType.name();
            if ("GET_ALL".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.OperationType.GET_ALL;
            } else if ("GET_BY_ID".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.OperationType.GET_BY_ID;
            } else if ("GET_BY_EMAIL".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.OperationType.GET_BY_EMAIL;
            } else if ("CREATE".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.OperationType.CREATE;
            } else if ("UPDATE".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.OperationType.UPDATE;
            } else if ("DELETE".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.OperationType.DELETE;
            } else if ("SEARCH".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.OperationType.SEARCH;
            }
            return fr.umontpellier.observability.model.UserAction.OperationType.GET_ALL;
        }

        private fr.umontpellier.observability.model.UserAction.EntityType convertEntityType(
                fr.umontpellier.injectlog4j.action.UserAction.EntityType entityType) {
            if (entityType == null) {
                return fr.umontpellier.observability.model.UserAction.EntityType.PRODUCT;
            }
            String name = entityType.name();
            if ("USER".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.EntityType.USER;
            } else if ("PRODUCT".equals(name)) {
                return fr.umontpellier.observability.model.UserAction.EntityType.PRODUCT;
            }
            return fr.umontpellier.observability.model.UserAction.EntityType.PRODUCT;
        }

        @Override
        public boolean isEnabled() {
            return true;
        }

        @Override
        public void shutdown() {
            // Nothing to clean up
        }
    }
}
