const fs = require('fs');

function readMovies() {
  return new Promise((resolve, reject) => {
    fs.readFile('movies.json', 'utf-8', (err, data) => {
      if (err) {
        reject('Error reading file: movies.json');
        return;
      }
      try {
        const movies = JSON.parse(data);
        resolve(movies);
      } catch (exception) {
        reject('Error parsing data ' + exception);
      }
    });
  });
}

function updateMovies(content) {
  return new Promise((resolve, reject) => {
    fs.writeFile('movies.json', content, (err) => {
      if (err) {
        reject('Error writing movies to file');
        return;
      }
      resolve('Movies Updated Successfully');
    });
  });
}

const prompt = require('prompt-sync')();

let movies = [];

async function updateMoviesFile() {
  await updateMovies(JSON.stringify(movies, null, 2))
    .then((success) => {
      console.log(success);
    })
    .catch((fail) => {
      console.log(fail);
    });
}

function getMovieInfo(movie) {
  return `Name: ${movie.name}, Year: ${movie.releaseYear}, Director: ${movie.director}, Rating: ${movie.rating}, Genres: ${movie.genres.join(', ')}`;
}

const manageMovies = () => {
  console.log('Reading movies from movies.json...');
  readMovies()
    .then((moviesCatalog) => {
      movies = moviesCatalog;
      movies.forEach((val) => {
        console.log(getMovieInfo(val));
      });

      getUserInput();
    })
    .catch((error) => {
      console.log(error);
    });
};

function printUserGuide() {
  console.log('1. Add New Movie');
  console.log('2. Delete a Movie');
  console.log('3. Update Movies');
  console.log('4. Search for a Movie');
  console.log('5. Fetch Movies');
}

const getUserInput = async () => {
  while (true) {
    printUserGuide();
    let userInput = prompt('Please select an option or \'e\' to exit: ');
    switch (userInput) {
      case 'e':
        return;
      case '1':
        let name = prompt('Name: '),
          releaseYear = prompt('Release Year: '),
          director = prompt('Director: '),
          rating = prompt('Rating: '),
          genres = prompt('Genres (comma-separated): ').split(',').map(genre => genre.trim());
        let movieObj = {
          name: name,
          releaseYear: parseInt(releaseYear),
          director: director,
          rating: parseFloat(rating),
          genres: genres,
        };
        movies.push(movieObj);
        await updateMoviesFile();
        break;
      case '2':
        movies.forEach((val) => {
          console.log(getMovieInfo(val));
        });
        let delName = prompt('Enter the name of the movie you want to delete: ');
        movies = movies.filter((value) => value.name !== delName);
        await updateMoviesFile();
        break;
      case '3':
        movies.forEach((val) => {
          console.log(getMovieInfo(val));
        });
        let updateName = prompt('Enter the name of the movie you want to update: ');
        let movieIndex = movies.findIndex((value) => value.name === updateName);
        if (movieIndex === -1) {
          console.log('The movie you want to update does not exist');
        } else {
          let newName = prompt('Name: '),
            newReleaseYear = prompt('Release Year: '),
            newDirector = prompt('Director: '),
            newRating = prompt('Rating: '),
            newGenres = prompt('Genres (comma-separated): ').split(',').map(genre => genre.trim());
          movies[movieIndex].name = newName;
          movies[movieIndex].releaseYear = parseInt(newReleaseYear);
          movies[movieIndex].director = newDirector;
          movies[movieIndex].rating = parseFloat(newRating);
          movies[movieIndex].genres = newGenres;
          await updateMoviesFile();
        }
        break;
      case '4':
        let searchFilter = prompt('Search Filter (name/year/director/genres/rating): ');
        let searchText = prompt('Search Text: ');
        let matchedMovies = [];
        if (searchFilter === 'name') {
          matchedMovies = movies.filter((movie) => movie.name.toLowerCase().includes(searchText.toLowerCase()));
        } else if (searchFilter === 'year') {
          matchedMovies = movies.filter((movie) => movie.releaseYear == searchText);
        } else if (searchFilter === 'director') {
          matchedMovies = movies.filter((movie) => movie.director.toLowerCase().includes(searchText.toLowerCase()));
        } else if (searchFilter === 'genres') {
          matchedMovies = movies.filter((movie) => movie.genres.some(genre => genre.toLowerCase().includes(searchText.toLowerCase())));
        } else if (searchFilter === 'rating') {
          matchedMovies = movies.filter((movie) => movie.rating == searchText);
        }
        console.log('Search Result:');
        if (matchedMovies.length === 0) {
          console.log('No movies match your search text');
        } else {
          matchedMovies.forEach((movie) => {
            console.log(getMovieInfo(movie));
          });
          console.log('\n');
        }
        break;
      case '5':
        try {
          let apiResponse = await fetchMovieData();
          let movieObj = {
            name: apiResponse.Title,
            releaseYear: parseInt(apiResponse.Year),
            director: apiResponse.Director,
            rating: parseFloat(apiResponse.imdbRating),
            genres: apiResponse.Genre.split(',').map(genre => genre.trim()),
          };
          movies.push(movieObj);
          await updateMoviesFile();
        } catch (exception) {
          console.log('Error parsing API response: ' + exception);
        }
        break;
      default:
        console.log('Invalid choice');
        break;
    }
  }
};

const fetchMovieData = () => {
  return new Promise((resolve, reject) => {
    const movieName = prompt('Enter the movie name to fetch: ');
    const apiUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=3804dca`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Request failed');
        }
        return response.json();
      })
      .then((responseData) => {
        if (responseData.Response === 'False') {
          throw new Error(responseData.Error);
        }
        resolve(responseData);
      })
      .catch((error) => {
        reject('Error Fetching Data from API: ' + error);
      });
  });
};

const main = () => {
  console.log('Welcome to the Movies Catalog');
  manageMovies();
};

main();
