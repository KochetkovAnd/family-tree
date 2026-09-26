package com.kochetkov.familytree.service;

import com.kochetkov.familytree.converter.PersonConverter;
import com.kochetkov.familytree.dto.PersonDTO;
import com.kochetkov.familytree.entity.Person;
import com.kochetkov.familytree.repository.PersonRepository;
import com.kochetkov.familytree.service.base.AuditEntityService;
import org.springframework.stereotype.Service;

@Service
public class PersonService extends AuditEntityService<Person, PersonDTO, PersonRepository, PersonConverter> {

    public PersonService(PersonRepository repository, PersonConverter converter) {
        super(repository, converter);
    }
}
