import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { SearchResponse, TedVideo } from '../models/video.model';

// ── Algolia (TED's own search backend) ──────────────────────────────────────
const ALGOLIA_URL   = 'https://zenith-prod-alt.ted.com/api/search';
const ALGOLIA_INDEX = 'coyote_models_acme_videos_alias_38ce41d1f97ca56a38068f613af166da';

// Maps our 5 UI categories → Algolia tag OR-groups
const CATEGORY_TAGS: Record<string, string[]> = {
  Technology:    ['technology', 'innovation', 'internet', 'computers', 'ai'],
  Entertainment: ['entertainment', 'culture', 'music', 'humor', 'art', 'film'],
  Design:        ['design', 'architecture', 'creativity', 'art'],
  Science:       ['science', 'biology', 'medicine', 'physics', 'neuroscience', 'psychology'],
  Business:      ['business', 'economics', 'work', 'leadership', 'entrepreneur'],
};

// ── Algolia response shapes ──────────────────────────────────────────────────
interface AlgoliaPhotoSize {
  url: string;
  width: number;
  height: number;
  talkstar_aspect_ratio_id: number;
}
interface AlgoliaHit {
  objectID: string;
  slug: string;
  title: string;
  speakers: string;
  photos: Array<{ photo_sizes: AlgoliaPhotoSize[] }>;
}
interface AlgoliaResult {
  hits: AlgoliaHit[];
  nbHits: number;
  nbPages: number;
}
interface AlgoliaResponse {
  results: AlgoliaResult[];
}

const DEFAULT_THUMB =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3Crect width='16' height='9' fill='%23e8f0f9'/%3E%3Ctext x='8' y='4.8' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='2.4' font-weight='700' fill='%23b0bcc8'%3ETED%3C/text%3E%3C/svg%3E";

const FALLBACK_TALKS: TedVideo[] = [
  // ── Technology ──────────────────────────────────────────────────────────
  { id: 'bill-gates-next-outbreak', youtubeId: '6Af6b_wyiwI', title: "The next outbreak? We're not ready", speaker: 'Bill Gates', category: 'Technology', thumbnail: DEFAULT_THUMB, description: 'Bill Gates warns that the world is not prepared for a global pandemic and outlines the investments needed to avert catastrophe.', link: 'https://www.ted.com/talks/bill_gates_the_next_outbreak_we_re_not_ready', publishedDate: '2015-03-18' },
  { id: 'sal-khan-ai-education', youtubeId: 'hJP5GqnTrNo', title: 'How AI could save (not destroy) education', speaker: 'Sal Khan', category: 'Technology', thumbnail: DEFAULT_THUMB, description: 'Sal Khan shares his vision of an AI-powered personal tutor for every student — and a teaching assistant for every teacher.', link: 'https://www.ted.com/talks/sal_khan_how_ai_could_save_not_destroy_education', publishedDate: '2023-05-02' },
  { id: 'elon-musk-future', youtubeId: 'zIwLWfaAg-8', title: "The future we're building — and boring", speaker: 'Elon Musk', category: 'Technology', thumbnail: DEFAULT_THUMB, description: 'Elon Musk talks about his vision for sustainable energy, electric cars, and interplanetary travel — including underground tunnels to ease traffic.', link: 'https://www.ted.com/talks/elon_musk_the_future_we_re_building_and_boring', publishedDate: '2017-04-28' },
  { id: 'pranav-mistry-sixthsense', youtubeId: 'YrtANPtnhyg', title: 'The thrilling potential of SixthSense technology', speaker: 'Pranav Mistry', category: 'Technology', thumbnail: DEFAULT_THUMB, description: 'Pranav Mistry demos several wearable devices that seamlessly merge the digital world with the physical world.', link: 'https://www.ted.com/talks/pranav_mistry_the_thrilling_potential_of_sixthsense_technology', publishedDate: '2009-11-12' },
  { id: 'tim-berners-lee-open-data', youtubeId: '3YcZ3Zqk0a8', title: 'The year open data went worldwide', speaker: 'Tim Berners-Lee', category: 'Technology', thumbnail: DEFAULT_THUMB, description: 'Tim Berners-Lee continues his campaign for open data and opens TED datasets for public use.', link: 'https://www.ted.com/talks/tim_berners_lee_the_year_open_data_went_worldwide', publishedDate: '2010-03-11' },
  // ── Entertainment ────────────────────────────────────────────────────────
  { id: 'ken-robinson-schools', youtubeId: 'iG9CE55wbtY', title: 'Do schools kill creativity?', speaker: 'Ken Robinson', category: 'Entertainment', thumbnail: DEFAULT_THUMB, description: 'Sir Ken Robinson makes an entertaining and profoundly moving case for creating an education system that nurtures, rather than undermines, creativity.', link: 'https://www.ted.com/talks/ken_robinson_says_schools_kill_creativity', publishedDate: '2006-06-27' },
  { id: 'brene-brown-vulnerability', youtubeId: 'iCvmsMzlF7o', title: 'The power of vulnerability', speaker: 'Brené Brown', category: 'Entertainment', thumbnail: DEFAULT_THUMB, description: "Brené Brown studies human connection — our ability to empathize, belong, love. In a poignant, funny talk, she shares insights from her research into human vulnerability.", link: 'https://www.ted.com/talks/brene_brown_the_power_of_vulnerability', publishedDate: '2010-12-23' },
  { id: 'chimamanda-adichie-single-story', youtubeId: 'D9Ihs241zeg', title: 'The danger of a single story', speaker: 'Chimamanda Ngozi Adichie', category: 'Entertainment', thumbnail: DEFAULT_THUMB, description: 'Our lives, our cultures, are composed of many overlapping stories. Novelist Chimamanda Adichie tells the story of how she found her authentic cultural voice — and warns of what is lost when complex people and places are reduced to a single narrative.', link: 'https://www.ted.com/talks/chimamanda_adichie_the_danger_of_a_single_story', publishedDate: '2009-10-07' },
  { id: 'tim-urban-procrastinator', youtubeId: 'arj7oStGLkU', title: 'Inside the mind of a master procrastinator', speaker: 'Tim Urban', category: 'Entertainment', thumbnail: DEFAULT_THUMB, description: "Tim Urban knows that procrastination doesn't make sense, but he's never been able to shake his habit. In this hilarious talk, he walks us through the irrational thought processes of the procrastinator's mind.", link: 'https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator', publishedDate: '2016-04-06' },
  { id: 'benjamin-zander-classical-music', youtubeId: 'r9LCwI5iErE', title: 'The transformative power of classical music', speaker: 'Benjamin Zander', category: 'Entertainment', thumbnail: DEFAULT_THUMB, description: 'Benjamin Zander has two infectious passions: classical music and helping people realize their untapped potential. In this charming talk, he shows how classical music is for everyone.', link: 'https://www.ted.com/talks/benjamin_zander_the_transformative_power_of_classical_music', publishedDate: '2008-11-16' },
  // ── Design ───────────────────────────────────────────────────────────────
  { id: 'elizabeth-gilbert-genius', youtubeId: '86x-u-tz0MA', title: 'Your elusive creative genius', speaker: 'Elizabeth Gilbert', category: 'Design', thumbnail: DEFAULT_THUMB, description: "Elizabeth Gilbert muses on the impossible things we expect from artists and geniuses — and considers the possibility that we're facing creativity all wrong.", link: 'https://www.ted.com/talks/elizabeth_gilbert_your_elusive_creative_genius', publishedDate: '2009-02-09' },
  { id: 'david-kelley-creative-confidence', youtubeId: '16p9YRF0l-g', title: 'How to build your creative confidence', speaker: 'David Kelley', category: 'Design', thumbnail: DEFAULT_THUMB, description: "Is your school or workplace divided into 'creatives' versus 'practicals'? David Kelley believes that's a false divide — everyone is creative, with the right mindset.", link: 'https://www.ted.com/talks/david_kelley_how_to_build_your_creative_confidence', publishedDate: '2012-03-12' },
  { id: 'don-norman-design-happy', youtubeId: 'RlQEoJaLQRA', title: '3 ways good design makes you happy', speaker: 'Don Norman', category: 'Design', thumbnail: DEFAULT_THUMB, description: 'Don Norman gives a tour of beautiful everyday objects — and argues that beauty is more than just appearances. He sees three kinds of design that affect our emotions.', link: 'https://www.ted.com/talks/don_norman_3_ways_good_design_makes_you_happy', publishedDate: '2003-02-01' },
  { id: 'paula-scher-design-serious', youtubeId: 'atn22-bmTPU', title: 'Great design is serious (not solemn)', speaker: 'Paula Scher', category: 'Design', thumbnail: DEFAULT_THUMB, description: 'Graphic design legend Paula Scher has spent four decades creating iconic brand identities — and this talk explores the difference between serious and solemn design.', link: 'https://www.ted.com/talks/paula_scher_great_design_is_serious_not_solemn', publishedDate: '2008-09-15' },
  { id: 'ingrid-fetell-lee-joy', youtubeId: 'A_u2WFTfbcg', title: 'Where joy hides and how to find it', speaker: 'Ingrid Fetell Lee', category: 'Design', thumbnail: DEFAULT_THUMB, description: 'Ingrid Fetell Lee reveals the surprising, counterintuitive places where we find joy — and shows how design can help us experience more of it.', link: 'https://www.ted.com/talks/ingrid_fetell_lee_where_joy_hides_and_how_to_find_it', publishedDate: '2018-04-27' },
  // ── Science ──────────────────────────────────────────────────────────────
  { id: 'dan-gilbert-happiness', youtubeId: 'LTO_dZUvbJA', title: 'The surprising science of happiness', speaker: 'Dan Gilbert', category: 'Science', thumbnail: DEFAULT_THUMB, description: 'Dan Gilbert presents research showing that human beings are remarkably good at adapting to change — including events they expected would make them miserable forever.', link: 'https://www.ted.com/talks/dan_gilbert_asks_why_are_we_happy', publishedDate: '2004-02-01' },
  { id: 'angela-duckworth-grit', youtubeId: 'H14bBuluwB8', title: 'Grit: The power of passion and perseverance', speaker: 'Angela Duckworth', category: 'Science', thumbnail: DEFAULT_THUMB, description: "Angela Lee Duckworth explains her theory of 'grit' as the best predictor of success — and why talent alone is never enough.", link: 'https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance', publishedDate: '2013-05-09' },
  { id: 'kelly-mcgonigal-stress', youtubeId: 'RcGyVTAoXEU', title: 'How to make stress your friend', speaker: 'Kelly McGonigal', category: 'Science', thumbnail: DEFAULT_THUMB, description: 'Psychologist Kelly McGonigal urges us to see stress as a positive, and introduces us to an unsung mechanism for stress reduction: reaching out to others.', link: 'https://www.ted.com/talks/kelly_mcgonigal_how_to_make_stress_your_friend', publishedDate: '2013-09-04' },
  { id: 'amy-cuddy-body-language', youtubeId: 'Ks-_Mh1QhMc', title: 'Your body language may shape who you are', speaker: 'Amy Cuddy', category: 'Science', thumbnail: DEFAULT_THUMB, description: "Body language affects how others see us, but it may also change how we see ourselves. Amy Cuddy shows how 'power posing' can affect testosterone and cortisol levels.", link: 'https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are', publishedDate: '2012-10-01' },
  { id: 'robert-waldinger-good-life', youtubeId: '8KkKuTCFvzI', title: 'What makes a good life? Lessons from the longest study on happiness', speaker: 'Robert Waldinger', category: 'Science', thumbnail: DEFAULT_THUMB, description: 'What keeps us happy and healthy as we go through life? Robert Waldinger shares three lessons from a 75-year study on adult life and happiness.', link: 'https://www.ted.com/talks/robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness', publishedDate: '2015-11-30' },
  // ── Business ─────────────────────────────────────────────────────────────
  { id: 'simon-sinek-leaders-inspire', youtubeId: 'qp0HIF3SfI4', title: 'How great leaders inspire action', speaker: 'Simon Sinek', category: 'Business', thumbnail: DEFAULT_THUMB, description: "Simon Sinek presents a simple but powerful model for how leaders inspire action, starting with a golden circle and the question 'Why?'", link: 'https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action', publishedDate: '2009-09-28' },
  { id: 'dan-pink-motivation', youtubeId: 'rrkrvAUbU9Y', title: 'The puzzle of motivation', speaker: 'Dan Pink', category: 'Business', thumbnail: DEFAULT_THUMB, description: "Career analyst Dan Pink examines the puzzle of motivation, starting with a fact that social scientists know but most managers don't: traditional rewards aren't as effective as we think.", link: 'https://www.ted.com/talks/dan_pink_the_puzzle_of_motivation', publishedDate: '2009-07-01' },
  { id: 'julian-treasure-speak', youtubeId: 'eIho2S0ZahI', title: 'How to speak so that people want to listen', speaker: 'Julian Treasure', category: 'Business', thumbnail: DEFAULT_THUMB, description: "Julian Treasure presents the human voice and offers seven deadly sins of speaking, then shares how to speak with honesty, authenticity, integrity, and love.", link: 'https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen', publishedDate: '2013-06-27' },
  { id: 'shawn-achor-happy-work', youtubeId: 'fLJsdqxnZb0', title: 'The happy secret to better work', speaker: 'Shawn Achor', category: 'Business', thumbnail: DEFAULT_THUMB, description: 'We believe we should work hard in order to be happy, but could we be thinking about this backwards? Shawn Achor argues that happiness inspires us to be more productive.', link: 'https://www.ted.com/talks/shawn_achor_the_happy_secret_to_better_work', publishedDate: '2011-05-19' },
  { id: 'simon-sinek-safe', youtubeId: 'lmyZMtPVodo', title: 'Why good leaders make you feel safe', speaker: 'Simon Sinek', category: 'Business', thumbnail: DEFAULT_THUMB, description: "What makes a great leader? Simon Sinek says the best leaders create an environment where people feel safe — and that safety inspires extraordinary performance.", link: 'https://www.ted.com/talks/simon_sinek_why_good_leaders_make_you_feel_safe', publishedDate: '2014-05-19' },
];

@Injectable({
  providedIn: 'root'
})
export class TedService {
  // Seed cache with fallback talks so detail pages always work for the curated set.
  private readonly cacheById = new Map<string, TedVideo>(
    FALLBACK_TALKS.map((v) => [v.id, TedService.withYtThumb(v)])
  );

  private static withYtThumb(v: TedVideo): TedVideo {
    return v.youtubeId
      ? { ...v, thumbnail: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg` }
      : v;
  }

  constructor(private readonly http: HttpClient) {}

  getCategories(): string[] {
    return ['Technology', 'Entertainment', 'Design', 'Science', 'Business'];
  }

  /**
   * Searches TED's full catalogue (~7 500 talks) via their Algolia backend.
   * Falls back to the curated 25 talks when the API is unreachable.
   */
  searchVideos(keyword: string, category: string, page = 1, pageSize = 10): Observable<SearchResponse> {
    const params: Record<string, unknown> = {
      attributeForDistinct: 'objectID',
      distinct: 1,
      hitsPerPage: pageSize,
      page: page - 1,   // Algolia is 0-indexed
      query: keyword.trim(),
    };

    if (category && CATEGORY_TAGS[category]) {
      // Inner array = OR across tag values
      params['facetFilters'] = [CATEGORY_TAGS[category].map(t => `tags:${t}`)];
    }

    return this.http.post<AlgoliaResponse>(ALGOLIA_URL, [{ indexName: ALGOLIA_INDEX, params }]).pipe(
      map((response) => {
        const result = response.results[0];
        const items = result.hits.map(h => this.mapHit(h, category));
        items.forEach(v => this.cacheById.set(v.id, v));
        return {
          items,
          total: result.nbHits,
          page,
          pageSize,
          totalPages: result.nbPages,
        };
      }),
      catchError(() => of(this.buildFallbackResponse(keyword, category, page, pageSize)))
    );
  }

  getVideoById(id: string): TedVideo | undefined {
    return this.cacheById.get(id);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private mapHit(hit: AlgoliaHit, selectedCategory: string): TedVideo {
    return {
      id: hit.slug,
      title: hit.title.trim(),
      speaker: (hit.speakers || '').trim() || 'TED Speaker',
      link: `https://www.ted.com/talks/${hit.slug}`,
      thumbnail: this.bestThumbnail(hit),
      description: '',
      category: selectedCategory || this.detectCategory(hit.title),
      publishedDate: '',
    };
  }

  private bestThumbnail(hit: AlgoliaHit): string {
    const sizes = hit.photos?.[0]?.photo_sizes;
    if (!sizes?.length) return DEFAULT_THUMB;
    // Prefer 1350×675 (ratio id 36), then any wide format, then first available
    return (
      sizes.find(s => s.talkstar_aspect_ratio_id === 36)?.url ||
      sizes.find(s => s.width > 0 && s.width / s.height > 1.4)?.url ||
      sizes[0]?.url ||
      DEFAULT_THUMB
    );
  }

  private buildFallbackResponse(keyword: string, category: string, page: number, pageSize: number): SearchResponse {
    const kw = keyword.trim().toLowerCase();
    let list = [...this.cacheById.values()];

    if (kw) {
      list = list.filter(v =>
        v.title.toLowerCase().includes(kw) ||
        v.speaker.toLowerCase().includes(kw) ||
        v.description.toLowerCase().includes(kw)
      );
    }
    if (category) {
      list = list.filter(v => v.category === category);
    }

    const safePage = Math.max(1, page);
    const start = (safePage - 1) * pageSize;
    return {
      items: list.slice(start, start + pageSize),
      total: list.length,
      page: safePage,
      pageSize,
      totalPages: Math.max(1, Math.ceil(list.length / pageSize)),
    };
  }

  private detectCategory(title: string): string {
    const t = title.toLowerCase();
    if (/tech|software|ai|robot|data|internet|digital|computer|code|engineer|innovat/.test(t)) return 'Technology';
    if (/design|architect|urban|visual|aesthetic|typograph|fashion/.test(t))                    return 'Design';
    if (/science|biology|physics|chemistry|research|medicine|brain|neuroscien|psychology/.test(t)) return 'Science';
    if (/business|leader|work|economy|market|company|startup|management|entrepren/.test(t))     return 'Business';
    return 'Entertainment';
  }
}
