package com.kochetkov.familytree.converter;

import com.kochetkov.familytree.converter.base.AbstractConverter;
import com.kochetkov.familytree.dto.PersonDTO;
import com.kochetkov.familytree.entity.Person;
import org.springframework.stereotype.Component;


@Component
public class PersonConverter extends AbstractConverter<Person, PersonDTO> {

    public PersonConverter() {
        super(Person::new, PersonDTO::new);
    }
}
