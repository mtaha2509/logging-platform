package com.example.backend.mappers;

import com.example.backend.dtos.AlertInfo;
import com.example.backend.entities.Alert;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AlertMapper {
    @Mapping(source = "createdBy.id", target = "createdById")
    @Mapping(source = "application.id", target = "applicationId")
    @Mapping(source = "application.name", target = "applicationName")
    AlertInfo toAlertInfo(Alert alert);
    
    List<AlertInfo> toAlertInfoList(List<Alert> alerts);
}
