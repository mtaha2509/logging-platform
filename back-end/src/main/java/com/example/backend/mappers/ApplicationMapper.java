package com.example.backend.mappers;

import com.example.backend.dtos.ApplicationInfo;
import com.example.backend.entities.Application;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {
    ApplicationInfo toApplicationInfo(Application application);
    List<ApplicationInfo> toApplicationInfoList(List<Application> applications);
}
