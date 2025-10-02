package com.example.backend.dtos;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Timestamp;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class LogDTO
{
    private Long id;
    private Timestamp timestamp;
    private String level;
    private String message;
    private Long applicationId;
    private String applicationName; // optional

}
