"use client"
import React, { useEffect, useState } from 'react'
import styles from "./component.module.css"
import NavButtons from '../../../../components/NavButtons';
import gogoanime from '@/api/gogoanime';
import { MediaEpisodes, MediaInfo, MediaSearchResult } from '@/app/ts/interfaces/apiGogoanimeDataInterface';
import LoadingSvg from "@/public/assets/Eclipse-1s-200px.svg"
import { stringToUrlFriendly } from '@/app/lib/convertStringToUrlFriendly';
import { EpisodesType } from '@/app/ts/interfaces/apiAnilistDataInterface';
import NavPaginateItems from '@/app/media/[id]/components/PaginateItems';
import aniwatch from '@/api/aniwatch';
import { EpisodeAnimeWatch, EpisodesFetchedAnimeWatch, MediaInfoAniwatch, MediaInfoFetchedAnimeWatch } from '@/app/ts/interfaces/apiAnimewatchInterface';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initFirebase } from '@/firebase/firebaseApp';
import ErrorImg from "@/public/error-img-2.png"
import Image from 'next/image';
import CrunchyrollEpisode from '../CrunchyrollEpisodeContainer';
import GoGoAnimeEpisode from '../GoGoAnimeEpisodeContainer';
import AniwatchEpisode from '../AniwatchEpisodeContainer';
import { AnimatePresence, motion } from 'framer-motion';
import simulateRange from '@/app/lib/simulateRange';

function EpisodesContainer(props: { data: EpisodesType[], mediaTitle: string, mediaId: number, totalEpisodes: number }) {

  const { data } = props

  const [loading, setLoading] = useState(false)
  const [episodesDataFetched, setEpisodesDataFetched] = useState<EpisodesType[] | MediaEpisodes[] | EpisodeAnimeWatch[]>(data)

  const [mediaResultsInfoArray, setMediaResultsInfoArray] = useState<MediaInfoAniwatch[]>([])

  const [currentItems, setCurrentItems] = useState<EpisodesType[] | MediaEpisodes[] | EpisodeAnimeWatch[] | null>(null);
  const [itemOffset, setItemOffset] = useState<number>(0);

  const [episodeSource, setEpisodeSource] = useState<string>("")

  const auth = getAuth()

  const [user] = useAuthState(auth)

  const db = getFirestore(initFirebase());

  // the length os episodes array will be divided by 25, getting the range of pagination
  const rangeEpisodesPerPage = 25

  const [pageCount, setPageCount] = useState<number>(0);

  // Invoke when user click to request another page.
  const handlePageClick = (event: { selected: number }) => {
    const newOffset = event.selected * rangeEpisodesPerPage % episodesDataFetched.length;

    setItemOffset(newOffset);
  };

  const setEpisodesSource: (parameter: string) => void = async (parameter: string) => {

    console.log(`Episodes Source Parameter: ${parameter} `)

    setEpisodeSource(parameter)

    getEpisodesFromNewSource(parameter)

  }

  const getEpisodesFromNewSource = async (source: string) => {

    // if data props has 0 length, it is set to get data from gogoanime
    const chooseSource = source

    if ((chooseSource == episodeSource) && episodesDataFetched.length > 0) return

    setLoading(true)

    const endOffset = itemOffset + rangeEpisodesPerPage

    // transform title in some way it can get query by other sources removing special chars
    const query = props.mediaTitle

    let mediaEpisodes

    switch (chooseSource) {

      case "crunchyroll":

        setEpisodeSource(chooseSource)

        setEpisodesDataFetched(data)

        setCurrentItems(data.slice(itemOffset, endOffset));
        setPageCount(Math.ceil(data.length / rangeEpisodesPerPage));

        setLoading(false)

        break

      // get data from gogoanime as default
      case "gogoanime":

        mediaEpisodes = await gogoanime.getInfoFromThisMedia(query, "anime") as MediaInfo

        setEpisodeSource(chooseSource)

        // if the name dont match any results, it will search for the query on the api, than make a new request by the ID of the first result 
        if (mediaEpisodes == null) {
          const searchResultsForMedia = await gogoanime.searchMedia(stringToUrlFriendly(query), "anime") as MediaSearchResult[]

          // try to found a result that matches the title from anilist on gogoanime (might work in some cases)
          const closestResult = searchResultsForMedia.find((item) => item.id.includes(query + "-tv"))

          mediaEpisodes = await gogoanime.getInfoFromThisMedia(closestResult?.id || searchResultsForMedia[0]?.id, "anime") as MediaInfo || null

          if (mediaEpisodes == null) {
            setLoading(false)
            setEpisodesDataFetched([])
            return
          }
        }

        // if theres no episodes on data, it simulates filling a array with episodes 
        if (mediaEpisodes.episodes.length == 0) {

          const episodes: MediaEpisodes[] = []

          simulateRange(props.totalEpisodes).map((item, key) => (

            episodes.push({
              number: key + 1,
              id: `${mediaEpisodes!.id.toLowerCase()}-episode-${key + 1}` || `${(searchResultsForMedia as any)[0].id.toLowerCase()}-episode-${key + 1}`,
              url: ""
            })

          ))

          setEpisodesDataFetched(episodes)

          setCurrentItems(episodes.slice(itemOffset, endOffset))
          setPageCount(Math.ceil(episodes.length / rangeEpisodesPerPage))

        }
        else {

          setEpisodesDataFetched(mediaEpisodes.episodes)

          setCurrentItems(mediaEpisodes.episodes.slice(itemOffset, endOffset))
          setPageCount(Math.ceil(mediaEpisodes.episodes.length / rangeEpisodesPerPage))

        }

        setLoading(false)

        break

      // get data from aniwatch
      default: // aniwatch

        setEpisodeSource(chooseSource)

        const searchResultsForMedia = await aniwatch.searchMedia(query) as MediaInfoFetchedAnimeWatch

        setMediaResultsInfoArray(searchResultsForMedia.animes)

        const closestResult = searchResultsForMedia.animes.find((item) => item.name.toUpperCase().includes(query)) || searchResultsForMedia.animes[0]

        mediaEpisodes = await aniwatch.getEpisodes(closestResult.id) as EpisodesFetchedAnimeWatch

        setEpisodesDataFetched(mediaEpisodes.episodes)

        setCurrentItems(mediaEpisodes.episodes.slice(itemOffset, endOffset));
        setPageCount(Math.ceil(mediaEpisodes.episodes.length / rangeEpisodesPerPage));

        setLoading(false)

        break

    }

  }

  // user can select a result that matches the page, if not correct
  const getEpisodesToThisMediaFromAniwatch = async (id: string) => {

    setLoading(true)

    const endOffset = itemOffset + rangeEpisodesPerPage

    const mediaEpisodes = await aniwatch.getEpisodes(id) as EpisodesFetchedAnimeWatch

    setEpisodesDataFetched(mediaEpisodes.episodes)

    setCurrentItems(mediaEpisodes.episodes.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(mediaEpisodes.episodes.length / rangeEpisodesPerPage));

    setLoading(false)

  }

  // get source setted on user profile
  const getUserDefaultSource = async () => {

    const userData = await getDoc(doc(db, "users", user!.uid))

    const userSource = await userData.get("videoSource").toLowerCase() || "crunchyroll"

    getEpisodesFromNewSource(userSource)

    setEpisodeSource(userSource)

  }

  useEffect(() => {

    if (user) {
      getUserDefaultSource()
    }
    else {
      // if there's no episodes coming from crunchyroll, gets episodes from other source
      getEpisodesFromNewSource(data.length == 0 ? "gogoanime" : "crunchyroll")
    }

  }, [user])

  useEffect(() => {

    const endOffset = itemOffset + rangeEpisodesPerPage;

    // if theres episodes from crunchyroll, sets the pagination pages
    if (episodeSource == "crunchyroll") {

      setPageCount(Math.ceil(data.length / rangeEpisodesPerPage));

    }

    setCurrentItems(episodesDataFetched.slice(itemOffset, endOffset));

  }, [episodesDataFetched, itemOffset, data, episodeSource])

  const loadingEpisodesMotion = {
    initial: {
      scale: 0,
    },
    animate: {
      scale: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div>

      <div id={styles.container_heading}>

        <NavButtons
          functionReceived={setEpisodesSource as (parameter: string | number) => void}
          actualValue={episodeSource}
          options={
            [
              { name: "Crunchyroll", value: "crunchyroll" },
              { name: "GoGoAnime", value: "gogoanime" },
              { name: "Aniwatch", value: "aniwatch" }
            ]
          }
          sepateWithSpan={true}
        />

        {episodeSource == "aniwatch" && (
          <div id={styles.select_media_container}>

            <small>Wrong Episodes? Select bellow!</small>

            <select onChange={(e) => getEpisodesToThisMediaFromAniwatch(e.target.value)}>
              {mediaResultsInfoArray.length > 0 && mediaResultsInfoArray?.map((item, key) => (
                <option key={key} value={item.id}>{item.name}</option>
              ))}
            </select>

          </div>
        )}

      </div>

      <ol id={styles.container} data-loading={loading}>

        <AnimatePresence>

          {currentItems && currentItems.map((item: EpisodesType | MediaEpisodes | EpisodeAnimeWatch, key: number) => (

            !loading && (

              episodeSource == "crunchyroll" && (

                <CrunchyrollEpisode key={key} data={item as EpisodesType} mediaId={props.mediaId} />

              )
              ||
              episodeSource == "gogoanime" && (

                <GoGoAnimeEpisode key={key} data={item as MediaEpisodes} mediaId={props.mediaId} />

              )
              ||
              episodeSource == "aniwatch" && (

                <AniwatchEpisode key={key} data={item as EpisodeAnimeWatch} mediaId={props.mediaId} />

              )
            )

          ))}

        </AnimatePresence>
      </ol>

      {loading && (
        <motion.div
          id={styles.loading_episodes_container}
          variants={loadingEpisodesMotion}
          initial="initial"
          animate="animate"
        >

          {simulateRange(15).map((item, key) => (

            <motion.div
              key={key}
              variants={loadingEpisodesMotion}
            >

              <LoadingSvg width={60} height={60} alt="Loading Episodes" />

            </motion.div>

          ))}

        </motion.div>
      )}

      {(episodesDataFetched.length == 0 && !loading) && (
        <div id={styles.no_episodes_container}>

          <Image src={ErrorImg} alt='Error' height={200} />

          <p>Not available on <span>{episodeSource}</span></p>

        </div>
      )}

      <nav id={styles.pagination_buttons_container}>

        <NavPaginateItems
          onPageChange={handlePageClick}
          pageCount={pageCount}
        />

      </nav>

    </div >
  )
}

export default EpisodesContainer