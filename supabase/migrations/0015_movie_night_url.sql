-- Lets scheduling include a direct deep link to the title itself (e.g. the
-- Netflix watch page), so "Open Netflix" lands straight on the movie
-- instead of the generic homepage requiring a search.
alter table movie_nights add column url text;
