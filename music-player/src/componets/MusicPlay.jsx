import React, { useState, useCallback, useEffect, useRef } from "react";
import "../App.css";
import mic from "../img/Michael.svg";
import ex from "../img/ex.png";
import pauseicon from "../img/211871_pause_icon.svg";
import { styled, useTheme } from "@mui/material/styles";
import Slider from "@mui/material/Slider";
import { IconButton, setRef } from "@mui/material";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import { Howl, Howler } from "howler";

const ItemTypes = {
  SONG: "song",
};
const SongRow = ({
  song,
  index,
  moveRow,
  setCurrentSongIndex,
  currentSongIndex,
  playSong
}) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ItemTypes.SONG,
    hover(item) {
      if (item.index !== index) {
        moveRow(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SONG,
    item: { type: ItemTypes.SONG, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr
      onClick={() => {
        setCurrentSongIndex(index);
        playSong(index)
      }}
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        background: `${index == currentSongIndex ? "rgba(82, 0, 0, 1)" :"transparent"}`,
      }}
    >
      <td>
        {index == currentSongIndex ? (
          <samp>
            <svg
              width="27"
              height="30"
              viewBox="0 0 27 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.25 23.5379C9.28325 23.5379 11.75 21.0711 11.75 18.0379V4.08849L24.125 8.58749V18.8037C23.2929 18.308 22.3435 18.0436 21.375 18.0379C18.3417 18.0379 15.875 20.5046 15.875 23.5379C15.875 26.5711 18.3417 29.0379 21.375 29.0379C24.4082 29.0379 26.875 26.5711 26.875 23.5379V7.62499C26.8752 7.34288 26.7884 7.06757 26.6265 6.83653C26.4646 6.6055 26.2355 6.42998 25.9702 6.33387L10.8452 0.833869C10.6376 0.757965 10.4147 0.733298 10.1955 0.761962C9.97631 0.790626 9.76726 0.871775 9.58613 0.998516C9.40499 1.12526 9.25712 1.29385 9.15508 1.48996C9.05304 1.68607 8.99984 1.90392 9 2.12499V13.3037C8.16794 12.808 7.21853 12.5436 6.25 12.5379C3.21675 12.5379 0.75 15.0046 0.75 18.0379C0.75 21.0711 3.21675 23.5379 6.25 23.5379Z"
                fill="#F6F6F6"
              />
            </svg>
          </samp>
        ) : (
          index + 1
        )}
      </td>
      <td>{song.title}</td>
      <td>{song.plays}</td>
      <td>{song.duration}</td>
      <td>{song.album}</td>
    </tr>
  );
};
const MusicPlay = () => {
  const theme = useTheme();
  const [songs, setSongs] = useState([]);
  const duration = 200; // seconds
  const [position, setPosition] = React.useState(0);

  const [currentSongIndex, setCurrentSongIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);
  const [progress, setProgress] = useState(0); // Track playback progress

  const intervalRef = useRef()
  useEffect(() => {
    fetch("https://fog-assessment.onrender.com/api/songs")
      .then((response) => response.json())
      .then((data) => setSongs(data))
      .catch((error) => console.error("Error fetching songs:", error));
  }, []);


  const playSong = (index) => {
    if (soundRef.current) {
        soundRef.current.stop();
    }
    const sound = new Howl({ src: [songs[index].src] });

    sound.on('play', () => {
        setIsPlaying(true);
        intervalRef.current = setInterval(() => {
            setProgress(sound.seek() || 0);
        }, 100);
    });

    sound.on('pause', () => {
        setIsPlaying(false);
        clearInterval(intervalRef.current);
    });

    sound.on('end', () => {
        clearInterval(intervalRef.current);
        const nextIndex = (currentSongIndex + 1) % songs.length;
        playSong(nextIndex);
    });

    sound.play();
    soundRef.current = sound;
    setCurrentSongIndex(index);
};
const togglePlayPause = () => {
  if (isPlaying) {
      soundRef.current.pause();
  } else {
      soundRef.current.play();
  }
  setIsPlaying(!isPlaying);
};


  const playNext = () => {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
  };

  const playPrevious = () => {
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(prevIndex);
  };

  const handleSliderChange = (event, newValue) => {
    soundRef.current.seek(newValue);
    setProgress(newValue);
};

  const moveRow = useCallback(
    (dragIndex, hoverIndex) => {
      const draggedRow = songs[dragIndex];
      setSongs(
        update(songs, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, draggedRow],
          ],
        })
      );
    },
    [songs]
  );
  function secondsToHMS(durationInSeconds) {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    let formattedTime = '';
   console.log(minutes)
    if (hours > 0) {
        formattedTime += hours.toString().padStart(2, '0') + ':';
    }

    if (minutes > 0 || hours > 0) {
        formattedTime += minutes.toString().padStart(2, '0') + ':';
    }
  

    formattedTime += seconds.toString().padStart(2, '0');

    return  formattedTime;
}
function secondsToHMSs(durationInSeconds) {
  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = Math.floor(durationInSeconds % 60);

  let formattedTime = '';
 console.log(minutes)
  if (hours > 0) {
      formattedTime += hours.toString().padStart(2, '0') + ':';
  }

  if (minutes > 0 || hours > 0) {
      formattedTime += minutes.toString().padStart(2, '0') + ':';
  }


  formattedTime += seconds.toString().padStart(2, '0');

  return formattedTime.length == 2 ? "00:"+formattedTime : formattedTime;
}

  return (
    <div class="relative  lg:ml-64 play-music-dev font-['Poppins'] app-min ">
      <div class="play-music font-['Poppins']">
        <div class="sm:p-6  p-2 flex justify-between relative">
          <div class="flex items-center gap-6 ml-8">
            <p class="text-[12px]">Music</p>
            <p class="text-[12px]">Podcast</p>
            <p class="text-[12px]">Live</p>
            <p class="text-[12px]">Radio</p>
          </div>
          <form action="/search" class="max-w-[480px] text-[14px]  sm:max-w-[300px] w-full px-4">
            <div class="relative">
              <input
                type="text"
                name="q"
                style={{
                  background: "rgba(44, 0, 0, 1)",
                  border: "1px soild rgba(44, 0, 0, 1)",
                }}
                class="w-full sm:text-[14px]  text-[10px]  h-8 shadow p-4 rounded-full dark:text-white-500 "
                placeholder="Michael Jackson"
              />
              <button type="submit">
                <svg
                  width="27"
                  height="27"
                  viewBox="0 0 27 27"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 absolute top-2 right-4"
                >
                  <path
                    d="M25.375 25.375L19.9544 19.9448L25.375 25.375ZM22.9583 12.6875C22.9583 15.4115 21.8762 18.0239 19.9501 19.9501C18.0239 21.8763 15.4115 22.9584 12.6875 22.9584C9.9635 22.9584 7.35107 21.8763 5.42491 19.9501C3.49876 18.0239 2.41666 15.4115 2.41666 12.6875C2.41666 9.96353 3.49876 7.3511 5.42491 5.42494C7.35107 3.49879 9.9635 2.41669 12.6875 2.41669C15.4115 2.41669 18.0239 3.49879 19.9501 5.42494C21.8762 7.3511 22.9583 9.96353 22.9583 12.6875V12.6875Z"
                    stroke="#F6F6F6"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
        <div class="card-play-name">
          <div class="flex g-[5px]">
            <samp>
              <svg
              
                viewBox="0 0 26 26"
                class="w-[16px] h-[16px] sm:w-[26] sm:h-[26]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.7125 25.6H12.3812L9.24999 22.375H4.61874L3.62499 21.4375V16.9L0.456238 13.675V12.3437L3.62499 9.11875V4.5625L4.61874 3.625H9.24999L12.3812 0.418747H13.7125L16.9375 3.625H21.4937L22.4312 4.54375V9.11875L25.6375 12.3437V13.675L22.375 16.9V21.4375L21.4375 22.375H16.9375L13.7125 25.6ZM10.6187 17.65H11.95L19.0187 10.5812L17.6875 9.25L11.2937 15.6625L8.70624 13.075L7.37499 14.4062L10.6187 17.65Z"
                  fill="url(#paint0_linear_1_148)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_1_148"
                    x1="13.0469"
                    y1="0.418747"
                    x2="33.4157"
                    y2="13.3084"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#53E0FF" />
                    <stop offset="1" stop-color="#1E94E9" />
                  </linearGradient>
                </defs>
              </svg>
            </samp>{" "}
            <p className="ml-[10px] mt-[2px] sm:text-[14px] text-[10px]">Verified Artist</p>
          </div>
          <p class="sm:text-[40px] font-bold text-[20px]	">Michael Jackson</p>
          <p class="sm:text-[14px] text-[10px]">27.852.501 monthly listeners</p>
          <img src={mic} class="absolute  bottom-0 right-[10px] lg:w-[535px] sm:h-[465px] sm-[300px] h-[400px]" />
        </div>
        <div className="App">
          <div class="flex justify-between	p-4">
            <p>Popular Songs</p> <p>See All</p>
          </div>

          <DndProvider backend={HTML5Backend}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Playing</th>
                  <th>Time</th>
                  <th>Album</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song, index) => (
                  <SongRow
                    key={song.id}
                    index={index}
                    song={song}
                    moveRow={moveRow}
                    setCurrentSongIndex={setCurrentSongIndex}
                    currentSongIndex={currentSongIndex}
                    playSong={playSong}
                  />
                ))}
              </tbody>
            </table>
          </DndProvider>
        </div>
      </div>
      <div class=" fixed play-music-se font-['Poppins']">
        <div
          class="relative mt-[auto] mb-[10px]  w-[284px] h-[376px] play-music-se-dev "
        >
          <p class="text-center text-[14px] pt-[10px]">Now Playing</p>
          <img
            style={{ margin: "10px auto" }}
            class="w-[239px] h-[136px] rounded-lg"
            src={ex}
            alt=""
          />

          <p class="text-center text-[12px] pt-[10px] font-bold">
            {songs[currentSongIndex]?.title}
          </p>
          <p class="text-center text-[13px] pt-[5px] font-light bg-[background: rgba(207, 197, 197, 1)]">
            Michael Jackson
          </p>
          <div
            style={{
              margin: "15px auto",
              justifyContent: "space-between",
       
              alignItems: "center",
            }}
            class="flex"
          >
            <p class="text-[13px] pl-[20px]">{progress == 0 ? "0:00" : secondsToHMSs(progress) }</p>
            <div class="absolute pt-[8px] ml-[70px] ">
              {" "}
              <Slider
                aria-label="time-indicator"
                size="small"
           
                style={{ width: "140px" }}
                min={0}
                step={1}
                value={progress}
                max={soundRef.current ? soundRef.current.duration() : 0}
                onChange={handleSliderChange}
             
                sx={{
                  color:
                    theme.palette.mode === "dark"
                      ? "white"
                      : "rgba(246, 246, 246, 1)",
                  height: 4,
                  // "& .MuiSlider-thumb": {
                  //   width: 8,
                  //   height: 8,
                  //   // transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                  //   "&::before": {
                  //     boxShadow: "0 2px 12px 0 rgba(246, 246, 246, 1)",
                  //   },
                  //   "&:hover, &.Mui-focusVisible": {
                  //     boxShadow: `0px 0px 0px 8px ${
                  //       theme.palette.mode === "dark"
                  //         ? "rgb(246, 246, 246, 1 / 16%)"
                  //         : "rgb(0 0 0 / 16%)"
                  //     }`,
                  //   },
                  //   "&.Mui-active": {
                  //     width: 20,
                  //     height: 20,
                  //   },
                  // },
                  // "& .MuiSlider-rail": {
                  //   opacity: 0.28,
                  // },
                }}
              />
            </div>

            <p class="text-[13px] pr-[20px]">{soundRef.current ? secondsToHMS(soundRef.current.duration()):"0:00"}</p> 
          </div>
          <div
            style={{
              margin: "10px auto",
              justifyContent: "center",
              gap: "2px",
              alignItems: "center",
            }}
            class="flex"
          >
            <IconButton style={{ transform: "translateX(-10px)" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.26 1.90751L12.1875 1.84251C12.0272 1.71598 11.8261 1.65269 11.6222 1.66468C11.4184 1.67666 11.226 1.76307 11.0817 1.90751L11.0167 1.98001C10.8902 2.14015 10.827 2.34117 10.8389 2.54488C10.8509 2.74859 10.9373 2.94081 11.0817 3.08501L12.1642 4.16585H7.49919L7.29919 4.16918C5.7884 4.2206 4.35662 4.85675 3.30582 5.94346C2.25502 7.03018 1.66732 8.48251 1.66669 9.99418C1.66669 11.1983 2.03169 12.3175 2.65752 13.2433C2.78604 13.423 2.98068 13.5443 3.19861 13.5805C3.41654 13.6167 3.63992 13.5648 3.8196 13.4363C3.99929 13.3077 4.12056 13.1131 4.15674 12.8952C4.19292 12.6772 4.14104 12.4539 4.01252 12.2742L3.90002 12.0925C3.53117 11.4596 3.33581 10.7405 3.33369 10.0079C3.33156 9.27537 3.52273 8.5552 3.8879 7.92012C4.25307 7.28504 4.77932 6.75754 5.41352 6.39086C6.04773 6.02418 6.76744 5.8313 7.50002 5.83168H12.1625L11.0817 6.91251L11.0167 6.98501C10.8814 7.15142 10.8155 7.36362 10.8328 7.5774C10.8501 7.79118 10.9492 7.99003 11.1096 8.13251C11.2699 8.27499 11.479 8.3501 11.6933 8.34218C11.9077 8.33426 12.1107 8.24393 12.26 8.09001L14.765 5.58751L14.8292 5.51501C14.9557 5.35487 15.0189 5.15386 15.0069 4.95015C14.995 4.74643 14.9086 4.55422 14.7642 4.41001L12.26 1.90751ZM17.3225 6.71668C17.2158 6.57973 17.0689 6.47956 16.9025 6.43022C16.736 6.38087 16.5583 6.3848 16.3942 6.44147C16.23 6.49813 16.0877 6.60469 15.9872 6.74624C15.8866 6.88778 15.8328 7.05722 15.8334 7.23085C15.8334 7.40501 15.8867 7.56585 15.9767 7.69835C16.391 8.32601 16.6277 9.05417 16.6614 9.80551C16.6952 10.5568 16.5249 11.3033 16.1685 11.9656C15.8122 12.6279 15.2831 13.1814 14.6374 13.5671C13.9918 13.9529 13.2538 14.1566 12.5017 14.1567H7.84502L8.92336 13.0817L8.99252 13.0017C9.10601 12.8547 9.16716 12.674 9.16625 12.4883C9.16535 12.3026 9.10244 12.1225 8.98752 11.9767L8.92336 11.9033L8.84419 11.8333C8.697 11.7196 8.51602 11.6583 8.33 11.6592C8.14397 11.6601 7.96359 11.7232 7.81752 11.8383L7.74419 11.9033L5.24002 14.4058L5.17085 14.485C5.05716 14.6321 4.99589 14.8129 4.9968 14.9988C4.99771 15.1847 5.06073 15.3649 5.17585 15.5108L5.24002 15.5833L7.74419 18.0858L7.82335 18.1558C7.98424 18.2801 8.18501 18.3413 8.38786 18.3278C8.59071 18.3144 8.78165 18.2273 8.92474 18.0829C9.06782 17.9384 9.15318 17.7467 9.16474 17.5437C9.17631 17.3408 9.11328 17.1406 8.98752 16.9808L8.92336 16.9083L7.83669 15.8225H12.5L12.7 15.82C13.7423 15.7842 14.7559 15.4695 15.6352 14.9087C16.5145 14.3479 17.2273 13.5616 17.6993 12.6316C18.1713 11.7016 18.3852 10.6621 18.3188 9.62131C18.2524 8.58053 17.9081 7.57661 17.3217 6.71418V6.71668H17.3225Z"
                  fill="#F6F6F6"
                />
              </svg>
            </IconButton>
            <IconButton type="submit" onClick={playPrevious} size="large">
              <samp>
                <svg
                  width="29"
                  height="29"
                  viewBox="0 0 29 29"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.2462 13.804L21.6906 6.62794C22.52 6.07259 23.2 6.48004 23.2 7.53419V21.4672C23.2 22.5185 22.52 22.9259 21.6906 22.3735L11.2462 15.1945C11.2462 15.1945 10.8417 14.906 10.8417 14.5014C10.8417 14.0954 11.2462 13.804 11.2462 13.804ZM8.70001 5.79999H7.25001C6.44816 5.79999 5.80001 5.86959 5.80001 6.66999V22.33C5.80001 23.1304 6.44816 23.2 7.25001 23.2H8.70001C9.50186 23.2 10.15 23.1304 10.15 22.33V6.66999C10.15 5.86959 9.50186 5.79999 8.70001 5.79999Z"
                    fill="#F6F6F6"
                  />
                </svg>
              </samp>
            </IconButton>
            <IconButton
              type="submit"
              onClick={() => {
                if (currentSongIndex == null) return;
                togglePlayPause();
              }}
              aria-label="delete"
              size="large"
              style={{ background: "rgba(72, 0, 0, 1)" }}
            >
              {isPlaying ? (
                <samp className="pl-[0px]">
                  <img src={pauseicon} />
                </samp>
              ) : (
                <samp className="pl-[5px]">
                  <svg
                    width="21"
                    height="23"
                    viewBox="0 0 21 23"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.34375 22.375C1.1034 22.375 0.872889 22.2795 0.702935 22.1096C0.53298 21.9396 0.4375 21.7091 0.4375 21.4687V1.53125C0.437527 1.37377 0.47859 1.21901 0.556642 1.08224C0.634694 0.945461 0.74704 0.831384 0.882608 0.751251C1.01818 0.671118 1.17228 0.627694 1.32974 0.625261C1.48721 0.622827 1.64258 0.661468 1.78056 0.737373L19.9056 10.7061C20.0477 10.7844 20.1661 10.8993 20.2487 11.0389C20.3312 11.1786 20.3747 11.3378 20.3747 11.5C20.3747 11.6622 20.3312 11.8214 20.2487 11.9611C20.1661 12.1007 20.0477 12.2156 19.9056 12.2939L1.78056 22.2626C1.64676 22.3363 1.4965 22.375 1.34375 22.375Z"
                      fill="#F6F6F6"
                    />
                  </svg>
                </samp>
              )}
            </IconButton>
            <IconButton type="submit" onClick={playNext} size="large">
              <samp>
                <svg
                  width="29"
                  height="29"
                  viewBox="0 0 29 29"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.7538 13.804L7.30944 6.62794C6.48004 6.07259 5.79999 6.48004 5.79999 7.53419V21.4672C5.79999 22.5185 6.48004 22.9259 7.30944 22.3735L17.7538 15.1945C17.7538 15.1945 18.1583 14.906 18.1583 14.5014C18.1583 14.0954 17.7538 13.804 17.7538 13.804ZM20.3 5.79999H21.75C22.5518 5.79999 23.2 5.86959 23.2 6.66999V22.33C23.2 23.1304 22.5518 23.2 21.75 23.2H20.3C19.4981 23.2 18.85 23.1304 18.85 22.33V6.66999C18.85 5.86959 19.4981 5.79999 20.3 5.79999Z"
                    fill="#F6F6F6"
                  />
                </svg>
              </samp>
            </IconButton>
            <IconButton style={{ transform: "translateX(10px)" }}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clip-path="url(#clip0_1_128)">
                  <path
                    d="M14.9609 9.78516C14.6354 10.1367 14.2318 10.0521 13.75 9.53126V6.28907C12.1484 6.41928 10.8659 6.75782 9.90234 7.30469C9.70703 6.51042 9.2513 5.79428 8.53516 5.15625C9.99349 4.21875 11.7318 3.74349 13.75 3.73047V0.449222C14.2318 -0.058591 14.6354 -0.136716 14.9609 0.214847L19.707 4.25782C19.9023 4.46615 20 4.71355 20 5C20 5.28646 19.9023 5.53386 19.707 5.74219L14.9609 9.78516ZM8.75 11.25C8.75 11.849 9.222 12.3763 10.166 12.832C11.11 13.2878 12.3047 13.5742 13.75 13.6914V10.4492C14.2318 9.94141 14.6354 9.86329 14.9609 10.2149L19.707 14.2578C19.9023 14.4662 20 14.7136 20 15C20 15.2865 19.9023 15.5339 19.707 15.7422L14.9609 19.7852C14.6354 20.1367 14.2318 20.0521 13.75 19.5313V16.25C12.3958 16.25 11.1426 16.0254 9.99023 15.5762C8.83789 15.127 7.92643 14.5182 7.25586 13.75C6.58529 12.9818 6.25 12.1484 6.25 11.25V8.75001C6.25 8.13803 5.77799 7.60417 4.83398 7.14844C3.88997 6.69271 2.69531 6.40626 1.25 6.28907V6.25001C0.911458 6.25001 0.61849 6.12631 0.371094 5.87891C0.123698 5.63152 0 5.33529 0 4.99024C0 4.64519 0.123698 4.34896 0.371094 4.10157C0.61849 3.85417 0.911458 3.73047 1.25 3.73047C2.60417 3.73047 3.85742 3.95508 5.00977 4.4043C6.16211 4.85352 7.07357 5.46224 7.74414 6.23047C8.41471 6.9987 8.75 7.83855 8.75 8.75001V11.25ZM1.25 13.75V13.6914C2.85156 13.5612 4.13411 13.2227 5.09766 12.6758C5.29297 13.457 5.7487 14.1732 6.46484 14.8242C5.00651 15.7747 3.26823 16.25 1.25 16.25C0.911458 16.25 0.61849 16.1263 0.371094 15.8789C0.123698 15.6315 0 15.3353 0 14.9902C0 14.6452 0.123698 14.3522 0.371094 14.1113C0.61849 13.8705 0.911458 13.75 1.25 13.75Z"
                    fill="#F6F6F6"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_1_128">
                    <rect width="20" height="20" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlay;
