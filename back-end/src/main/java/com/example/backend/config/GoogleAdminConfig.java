package com.example.backend.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.directory.Directory;
import com.google.api.services.directory.DirectoryScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Configuration
@Data
public class GoogleAdminConfig {

    private static String ADMIN_EMAIL;

    @Value("${company.admin}")
    public void setAdminEmail(String adminEmail) {
        GoogleAdminConfig.ADMIN_EMAIL = adminEmail;
    }

    @Bean
    public GoogleCredentials googleCredentials() throws IOException {
        InputStream serviceAccountStream = new ClassPathResource("service-account-api.json").getInputStream();
        return GoogleCredentials.fromStream(serviceAccountStream)
                .createScoped(Collections.singleton(DirectoryScopes.ADMIN_DIRECTORY_USER_READONLY))
                .createDelegated(GoogleAdminConfig.ADMIN_EMAIL);
    }
    @Bean
    public Directory directoryService(GoogleCredentials credentials) throws IOException, GeneralSecurityException {
        return new Directory.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("LoggingPlatform")
                .build();
    }
}
