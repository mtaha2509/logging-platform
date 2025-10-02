package com.example.backend.filter;
import org.apache.logging.log4j.ThreadContext;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

@Component
public class LoggingFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_HEADER = "X-Trace-ID";
    private static final String TRACE_ID_KEY = "traceid";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Get traceid from header or generate a new one
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString();
        }

        // Put the traceid into BOTH ThreadContext AND SLF4J MDC
        ThreadContext.put(TRACE_ID_KEY, traceId);
        MDC.put(TRACE_ID_KEY, traceId);
        
        try {
            // Add traceid to the response header so the client knows it
            response.addHeader(TRACE_ID_HEADER, traceId);
            filterChain.doFilter(request, response);
        } finally {
            // Clear the context after the request is processed
            ThreadContext.clearMap();
            MDC.clear();
        }
    }
}
