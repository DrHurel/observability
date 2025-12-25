package fr.umontpellier.observability.config;

import fr.umontpellier.injectlog4j.action.ActionInjector;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Servlet filter that extracts user context from HTTP headers
 * and sets it in the ActionInjector for profiling purposes.
 * 
 * The user context is stored in a ThreadLocal and is available
 * during the entire request processing.
 * 
 * Expected headers:
 * - X-User-Id: The user's unique identifier
 * - X-User-Email: The user's email address
 * - X-User-Name: The user's display name
 */
@Component
@Order(1)
public class UserContextFilter implements Filter {

    private static final String USER_ID_HEADER = "X-User-Id";
    private static final String USER_EMAIL_HEADER = "X-User-Email";
    private static final String USER_NAME_HEADER = "X-User-Name";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (request instanceof HttpServletRequest httpRequest) {
            String userId = httpRequest.getHeader(USER_ID_HEADER);
            String userEmail = httpRequest.getHeader(USER_EMAIL_HEADER);
            String userName = httpRequest.getHeader(USER_NAME_HEADER);

            // Set user context in ActionInjector
            if (userId != null || userEmail != null) {
                ActionInjector.getInstance().setUserContext(userId, userEmail, userName);
            }

            try {
                chain.doFilter(request, response);
            } finally {
                // Clear user context after request processing
                ActionInjector.getInstance().clearUserContext();
            }
        } else {
            chain.doFilter(request, response);
        }
    }
}
