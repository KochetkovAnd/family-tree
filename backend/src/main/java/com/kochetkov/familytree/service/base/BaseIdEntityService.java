package com.kochetkov.familytree.service.base;

import com.kochetkov.familytree.converter.base.BaseConverter;
import com.kochetkov.familytree.dto.auth.base.BaseIdEntityDTO;
import com.kochetkov.familytree.entity.base.BaseIdEntity;
import com.kochetkov.familytree.exception.ApiException;
import com.kochetkov.familytree.repository.base.BaseIdEntityRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@FieldDefaults(level = AccessLevel.PROTECTED, makeFinal = true)
@RequiredArgsConstructor
public abstract class BaseIdEntityService<
        Entity extends BaseIdEntity,
        DTO extends BaseIdEntityDTO,
        Repository extends BaseIdEntityRepository<Entity>,
        Converter extends BaseConverter<Entity, DTO>
        > implements CrudService<DTO> {

    Repository repository;
    Converter converter;

    @Override
    @Transactional(readOnly = true)
    public List<DTO> findAll() {
        return repository.findAll().stream().map(converter::toDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public DTO findById(Long id) {
        return converter.toDTO(getOrThrow(id));
    }

    @Override
    @Transactional
    public DTO create(DTO dto) {
        return converter.toDTO(repository.saveAndFlush(converter.toEntity(dto)));
    }

    @Override
    @Transactional
    public DTO update(DTO dto) {
        Entity entity = getOrThrow(dto.getId());
        converter.toEntity(dto, entity);
        return converter.toDTO(repository.saveAndFlush(entity));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    private Entity getOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Не найдено: id=" + id));
    }
}
